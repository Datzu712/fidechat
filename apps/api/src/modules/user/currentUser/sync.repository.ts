import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { and, eq, inArray, ne } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '@/infrastructure/database/drizzle.provider.js';
import { appUser, channel, guild, guildUsers } from '@/infrastructure/database/schema/index.js';
import type { SyncPayload } from '@fidechat/shared';

import { PresenceService } from '@/modules/gateway/presence.service.js';

/**
 * Reemplaza al paquete `pkg_sync_data` de Oracle.
 *
 * Aquella version armaba el JSON dentro de la base con JSON_ARRAYAGG /
 * JSON_OBJECT y lo devolvia como CLOB. Ahora son cuatro consultas de Drizzle y
 * el JSON lo serializa Nest. La forma del payload es identica para no romper al
 * frontend.
 */
@Injectable()
export class SyncRepository {
    private readonly logger = new Logger(SyncRepository.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly presence: PresenceService,
    ) {}

    async getCurrentUserData(userId: string): Promise<SyncPayload> {
        const currentUser = (
            await this.db
                .select({
                    id: appUser.id,
                    username: appUser.username,
                    email: appUser.email,
                    isBot: appUser.isBot,
                    avatarUrl: appUser.avatarUrl,
                })
                .from(appUser)
                .where(eq(appUser.id, userId))
                .limit(1)
        ).at(0);

        if (!currentUser) {
            this.logger.warn(`No sync data found for user ${userId}`);
            throw new BadRequestException('No sync data found for user');
        }

        try {
            const memberships = await this.db
                .select({ guildId: guildUsers.guildId })
                .from(guildUsers)
                .where(eq(guildUsers.userId, userId));

            const guildIds = memberships.map((m) => m.guildId);
            const connectedUsers = this.presence.activeUsers;

            if (!guildIds.length) {
                return { guilds: [], channels: [], currentUser, users: [], connectedUsers };
            }

            const [guilds, channels, users] = await Promise.all([
                this.db.query.guild.findMany({
                    where: inArray(guild.id, guildIds),
                    with: { members: { columns: { userId: true } } },
                }),
                this.db.query.channel.findMany({
                    where: inArray(channel.guildId, guildIds),
                    orderBy: (c, { asc }) => [asc(c.position)],
                    with: {
                        messages: {
                            columns: { id: true, content: true, authorId: true, channelId: true, createdAt: true },
                            orderBy: (m, { asc }) => [asc(m.createdAt)],
                        },
                    },
                }),
                this.db
                    .selectDistinct({
                        id: appUser.id,
                        username: appUser.username,
                        avatarUrl: appUser.avatarUrl,
                        isBot: appUser.isBot,
                    })
                    .from(appUser)
                    .innerJoin(guildUsers, eq(guildUsers.userId, appUser.id))
                    .where(and(inArray(guildUsers.guildId, guildIds), ne(appUser.id, userId))),
            ]);

            // Drizzle reads timestamps as Date; the wire shape is an ISO string.
            const wireChannels = channels.map((c) => ({
                ...c,
                messages: c.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
            }));

            return { guilds, channels: wireChannels, currentUser, users, connectedUsers };
        } catch (error) {
            this.logger.error(error);

            throw new InternalServerErrorException('Failed to build sync data for user', { cause: error });
        }
    }
}
