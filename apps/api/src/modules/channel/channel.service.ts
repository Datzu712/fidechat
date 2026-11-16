import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SocketEvents } from '@fidechat/shared';

import { ChannelDto } from './dto/channel.dto.js';
import { ChannelRepository } from './channel.repository.js';
import { GatewayService } from '../gateway/gateway.service.js';
import { UserRepository } from '../user/user.repository.js';

@Injectable()
export class ChannelService {
    constructor(
        private readonly channelRepository: ChannelRepository,
        private readonly gateway: GatewayService,
        private readonly userRepository: UserRepository,
    ) {}

    public async createChannel(guildId: string, dto: ChannelDto) {
        try {
            const created = await this.channelRepository.createChannel(guildId, dto);

            const guildMembers = (await this.userRepository.getGuildUsers(guildId)).map((user) => user.id);

            this.gateway.emitToUsers(guildMembers, SocketEvents.CHANNEL_CREATE, created);

            return { id: created.id, success: true };
        } catch (error) {
            if (!(error instanceof HttpException)) {
                throw new InternalServerErrorException('Failed to create channel', { cause: error });
            }
            throw error;
        }
    }
}
