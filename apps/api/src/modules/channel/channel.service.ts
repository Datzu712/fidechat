import { SocketEvents } from '@fidechat/shared';
import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';

import { SocketEmitter } from '../gateway/socket-emitter.js';
import { UserRepository } from '../user/user.repository.js';
import { ChannelRepository } from './channel.repository.js';
import { ChannelDto } from './dto/channel.dto.js';

@Injectable()
export class ChannelService {
    constructor(
        private readonly channelRepository: ChannelRepository,
        private readonly emitter: SocketEmitter,
        private readonly userRepository: UserRepository,
    ) {}

    public async createChannel(guildId: string, dto: ChannelDto) {
        try {
            const created = await this.channelRepository.createChannel(guildId, dto);

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
