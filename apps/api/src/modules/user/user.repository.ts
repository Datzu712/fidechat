import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';

import { AuditService } from '@/infrastructure/database/audit/audit.service';
import { DRIZZLE, type DrizzleDB } from '@/infrastructure/database/drizzle.provider';
import { type AppUser, appUser, guildUsers } from '@/infrastructure/database/schema';

export interface UpsertUserInput {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
    isBot?: boolean;
    /** Guild al que se agrega al usuario si aun no pertenece. Por defecto `DEFAULT_GUILD_ID`. */
    defaultGuildId?: string;
}

export interface UpsertUserResult {
    wasAddedToGuild: boolean;
    /** Solo viene poblado cuando `wasAddedToGuild` es true, igual que el SP de Oracle. */
    guildId: string | null;
}

@Injectable()
export class UserRepository {
    private readonly logger = new Logger(UserRepository.name);
    public readonly DEFAULT_GUILD_ID: string;

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly config: ConfigService<IEnvironmentVariables>,
        private readonly audit: AuditService,
    ) {
        this.DEFAULT_GUILD_ID = this.config.getOrThrow('DEFAULT_GUILD_ID');
    }

    async findById(id: string): Promise<AppUser | undefined> {
        const [user] = await this.db.select().from(appUser).where(eq(appUser.id, id)).limit(1);
        return user;
    }

    /**
     * Reemplazo de `PKG_USER.SP_UPSERT_USER`.
     *
     * Inserta o actualiza el usuario y, si todavia no pertenece al guild por
     * defecto, lo agrega. Todo en una sola transaccion junto con la auditoria.
     */
    async upsertUser(user: UpsertUserInput): Promise<UpsertUserResult> {
        const targetGuildId = user.defaultGuildId ?? this.DEFAULT_GUILD_ID;

        try {
            return await this.db.transaction(async (tx) => {
                const before = (await tx.select().from(appUser).where(eq(appUser.id, user.id)).limit(1)).at(0);

                const [after] = await tx
                    .insert(appUser)
                    .values({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        avatarUrl: user.avatarUrl ?? null,
                        isBot: user.isBot ?? false,
                    })
                    .onConflictDoUpdate({
                        target: appUser.id,
                        set: {
                            username: user.username,
                            email: user.email,
                            avatarUrl: user.avatarUrl ?? null,
                            // Solo se pisa si el llamador lo declara explicitamente.
                            ...(user.isBot === undefined ? {} : { isBot: user.isBot }),
                        },
                    })
                    .returning();

                await this.audit.record(tx, {
                    table: 'app_user',
                    operation: before ? 'UPDATE' : 'INSERT',
                    recordId: user.id,
                    before,
                    after,
                    actorId: user.id,
                });

                if (!targetGuildId) {
                    return { wasAddedToGuild: false, guildId: null };
                }

                const membership = await tx
                    .insert(guildUsers)
                    .values({ guildId: targetGuildId, userId: user.id })
                    .onConflictDoNothing()
                    .returning();

                if (!membership.length) {
                    return { wasAddedToGuild: false, guildId: null };
                }

                await this.audit.record(tx, {
                    table: 'guild_users',
                    operation: 'INSERT',
                    recordId: `${targetGuildId}:${user.id}`,
                    after: membership[0],
                    actorId: user.id,
                });

                return { wasAddedToGuild: true, guildId: targetGuildId };
            });
        } catch (error) {
            this.logger.error(new Error('Error in upsertUser', { cause: error }));
            throw error;
        }
    }

    /**
     * Todos los usuarios que pertenecen a un guild.
     *
     * Reemplaza al procedimiento `sp_get_guild_users`, que devolvia un
     * SYS_REFCURSOR con las columnas en MAYUSCULAS. Ahora devuelve objetos ya en
     * camelCase.
     */
    async getGuildUsers(guildId: string): Promise<AppUser[]> {
        try {
            return await this.db
                .select({
                    id: appUser.id,
                    username: appUser.username,
                    email: appUser.email,
                    isBot: appUser.isBot,
                    avatarUrl: appUser.avatarUrl,
                })
                .from(appUser)
                .innerJoin(guildUsers, eq(guildUsers.userId, appUser.id))
                .where(eq(guildUsers.guildId, guildId));
        } catch (error) {
            this.logger.error(error);

            throw new InternalServerErrorException('Failed to get guild users', { cause: error });
        }
    }
}
