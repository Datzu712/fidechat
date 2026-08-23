import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { v4 } from 'uuid';

import { Logger } from '@/common/logger';
import { AuditService } from '@/infrastructure/database/audit/audit.service';
import { DRIZZLE, type DrizzleDB } from '@/infrastructure/database/drizzle.provider';
import { type Channel, channel } from '@/infrastructure/database/schema';
import { ChannelDto } from './dto/channel.dto';

export type { Channel };

@Injectable()
export class ChannelRepository {
    private readonly logger = new Logger(ChannelRepository.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly audit: AuditService,
    ) {}

    /** Reemplaza a `PKG_CHANNEL.CREATE_CHANNEL`. */
    async createChannel(guildId: string, dto: ChannelDto, actorId?: string): Promise<{ id: string; success: boolean }> {
        try {
            const channelId = v4();

            await this.db.transaction(async (tx) => {
                const [created] = await tx
                    .insert(channel)
                    .values({
                        id: channelId,
                        name: dto.name,
                        description: dto.description ?? null,
                        position: dto.position ?? 0,
                        guildId,
                    })
                    .returning();

                await this.audit.record(tx, {
                    table: 'channel',
                    operation: 'INSERT',
                    recordId: channelId,
                    after: created,
                    actorId,
                });
            });

            return { id: channelId, success: true };
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException('Failed to create channel');
        }
    }

    /**
     * Reemplaza a `PKG_CHANNEL.GET_CHANNEL`.
     *
     * Devuelve `null` cuando no existe, en vez de lanzar: quien llama decide si
     * eso es un 404 (asi lo hacia ya `MessageService`).
     */
    async getChannel(id: string): Promise<Channel | null> {
        try {
            const found = (await this.db.select().from(channel).where(eq(channel.id, id)).limit(1)).at(0);
            return found ?? null;
        } catch (error) {
            this.logger.error(new Error(`Failed to get channel with id ${id}`, { cause: error }));
            throw new InternalServerErrorException('Failed to get channel');
        }
    }

    /** Reemplaza a `PKG_CHANNEL.GET_GUILD_CHANNELS`. */
    async getGuildChannels(guildId: string): Promise<Channel[]> {
        try {
            return await this.db
                .select()
                .from(channel)
                .where(eq(channel.guildId, guildId))
                .orderBy(asc(channel.position));
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException('Failed to get guild channels');
        }
    }
}
