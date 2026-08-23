import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { v4 } from 'uuid';

import { Logger } from '@/common/logger';
import { AuditService } from '@/infrastructure/database/audit/audit.service';
import { DRIZZLE, type DrizzleDB } from '@/infrastructure/database/drizzle.provider';
import { type Guild, guild, guildUsers } from '@/infrastructure/database/schema';
import { GuildDto } from './dto/guild.dto';

export type { Guild };

@Injectable()
export class GuildRepository {
    private readonly logger = new Logger(GuildRepository.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly audit: AuditService,
    ) {}

    /**
     * Reemplaza a `PKG_GUILD.CREATE_GUILD` mas el trigger `trg_guild_add_owner`:
     * el alta del guild y el alta del dueno como miembro ocurren en la misma
     * transaccion, igual que antes, pero ahora de forma explicita.
     */
    async createGuild(ownerId: string, dto: GuildDto): Promise<{ id: string; success: boolean }> {
        try {
            const guildId = v4();

            await this.db.transaction(async (tx) => {
                const [created] = await tx
                    .insert(guild)
                    .values({
                        id: guildId,
                        name: dto.name,
                        iconUrl: dto.iconUrl ?? null,
                        isPublic: dto.isPublic ?? false,
                        ownerId,
                    })
                    .returning();

                await this.audit.record(tx, {
                    table: 'guild',
                    operation: 'INSERT',
                    recordId: guildId,
                    after: created,
                    actorId: ownerId,
                });

                const membership = (
                    await tx.insert(guildUsers).values({ guildId, userId: ownerId }).onConflictDoNothing().returning()
                ).at(0);

                if (membership) {
                    await this.audit.record(tx, {
                        table: 'guild_users',
                        operation: 'INSERT',
                        recordId: `${guildId}:${ownerId}`,
                        after: membership,
                        actorId: ownerId,
                    });
                }
            });

            return { id: guildId, success: true };
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException('Failed to create guild', { cause: error });
        }
    }

    async getGuild(id: string): Promise<Guild> {
        try {
            const found = (await this.db.select().from(guild).where(eq(guild.id, id)).limit(1)).at(0);

            if (!found) {
                throw new NotFoundException('Guild not found');
            }

            return found;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(error);
            throw new InternalServerErrorException('Failed to get guild', { cause: error });
        }
    }

    /**
     * Reemplaza a `PKG_GUILD.UPDATE_GUILD`, que armaba un `EXECUTE IMMEDIATE`
     * concatenando los valores recibidos. Aqui el SET se construye por columna y
     * los valores viajan como parametros.
     */
    async updateGuild(id: string, dto: Partial<GuildDto>, actorId?: string): Promise<{ success: boolean }> {
        const changes: Partial<typeof guild.$inferInsert> = {};
        if (dto.name !== undefined) changes.name = dto.name;
        if (dto.iconUrl !== undefined) changes.iconUrl = dto.iconUrl;
        if (dto.isPublic !== undefined) changes.isPublic = dto.isPublic;

        if (!Object.keys(changes).length) {
            return { success: true };
        }

        try {
            await this.db.transaction(async (tx) => {
                const before = (await tx.select().from(guild).where(eq(guild.id, id)).limit(1)).at(0);

                if (!before) {
                    throw new NotFoundException(`Could not update guild. Guild not found for ID: ${id}`);
                }

                const [after] = await tx.update(guild).set(changes).where(eq(guild.id, id)).returning();

                await this.audit.record(tx, {
                    table: 'guild',
                    operation: 'UPDATE',
                    recordId: id,
                    before,
                    after,
                    actorId,
                });
            });

            return { success: true };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(error);
            throw new InternalServerErrorException('Failed to update guild', { cause: error });
        }
    }

    async getPublicGuilds(): Promise<Guild[]> {
        try {
            return await this.db.select().from(guild).where(eq(guild.isPublic, true));
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException('Failed to get public guilds', { cause: error });
        }
    }
}
