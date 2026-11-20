import { SocketEvents } from '@fidechat/shared';
import { ForbiddenException, Injectable } from '@nestjs/common';

import { GuildRepository } from '../guild/guild.repository.js';
import { GuildEmitter } from '../user/guild-emitter.js';
import { ChannelRepository } from './channel.repository.js';
import { ChannelDto } from './dto/channel.dto.js';

@Injectable()
export class ChannelService {
    constructor(
        private readonly channelRepository: ChannelRepository,
        private readonly guildRepository: GuildRepository,
        private readonly guildEmitter: GuildEmitter,
    ) {}

    /** Only the guild owner creates channels. */
    public async createChannel({ guildId, userId, channel }: { guildId: string; userId: string; channel: ChannelDto }) {
        const guild = await this.guildRepository.getGuild(guildId);
        if (guild.ownerId !== userId) throw new ForbiddenException('Only the guild owner can create channels');

        const created = await this.channelRepository.createChannel(guildId, channel);
        await this.guildEmitter.emitToGuild(guildId, SocketEvents.CHANNEL_CREATE, created);

        return { id: created.id, success: true };
    }
}
