import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { v4 } from 'uuid';

import { AuditService } from '@/infrastructure/database/audit/audit.service.js';
import { DRIZZLE, type DrizzleDB } from '@/infrastructure/database/drizzle.provider.js';
import { type Channel, channel } from '@/infrastructure/database/schema/index.js';

import { ChannelDto } from './dto/channel.dto.js';

export type { Channel };

@Injectable()
export class ChannelRepository {
    private readonly logger = new Logger(ChannelRepository.name);

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly audit: AuditService,
    ) {}

    async createChannel(guildId: string, dto: ChannelDto, actorId?: string): Promise<Channel> {
        try {
            const channelId = v4();

            return await this.db.transaction(async (tx) => {
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

                return created;
            });
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException('Failed to create channel');
        }
    }

    async getChannel(id: string): Promise<Channel | null> {
        try {
            const found = (await this.db.select().from(channel).where(eq(channel.id, id)).limit(1)).at(0);
            return found ?? null;
        } catch (error) {
            this.logger.error(new Error(`Failed to get channel with id ${id}`, { cause: error }));
            throw new InternalServerErrorException('Failed to get channel');
        }
    }

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
