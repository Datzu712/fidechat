import { SocketEvents } from '@fidechat/shared';
import { ForbiddenException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';

import { SocketEmitter } from '../gateway/socket-emitter.js';
import { GuildRepository } from '../guild/guild.repository.js';
import { UserRepository } from '../user/user.repository.js';
import { ChannelRepository } from './channel.repository.js';
import { ChannelDto } from './dto/channel.dto.js';

@Injectable()
export class ChannelService {
    constructor(
        private readonly channelRepository: ChannelRepository,
        private readonly emitter: SocketEmitter,
        private readonly userRepository: UserRepository,
        private readonly guildRepository: GuildRepository,
    ) {}

    /** Only the guild owner creates channels. */
    public async createChannel({ guildId, userId, channel }: { guildId: string; userId: string; channel: ChannelDto }) {
        const guild = await this.guildRepository.getGuild(guildId);
        if (guild.ownerId !== userId) throw new ForbiddenException('Only the guild owner can create channels');

        try {
            const created = await this.channelRepository.createChannel(guildId, channel);

            const guildMembers = (await this.userRepository.getGuildUsers(guildId)).map((user) => user.id);

            this.emitter.emitToUsers(guildMembers, SocketEvents.CHANNEL_CREATE, created);

            return { id: created.id, success: true };
        } catch (error) {
            if (!(error instanceof HttpException)) {
                throw new InternalServerErrorException('Failed to create channel', { cause: error });
            }
            throw error;
        }
    }
}
