import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';

import { SocketEvents } from '@fidechat/shared';
import { GatewayService } from '../gateway/gateway.service.js';
import { GuildDto } from './dto/guild.dto.js';
import { GuildRepository } from './guild.repository.js';

@Injectable()
export class GuildService {
    constructor(
        private readonly guildRepository: GuildRepository,
        private readonly gateway: GatewayService,
    ) {}

    public async createGuild(ownerId: string, dto: GuildDto) {
        try {
            const result = await this.guildRepository.createGuild(ownerId, dto);

            // eslint-disable-next-line @typescript-eslint/no-misused-spread -- silly rule
            this.gateway.emitToUser(ownerId, SocketEvents.GUILD_CREATE, { ...dto, ownerId, id: result.id });

            return result;
        } catch (error) {
            if (!(error instanceof HttpException)) {
                throw new InternalServerErrorException('Failed to create guild', { cause: error });
            }
            throw error;
        }
    }

    public async getPublicGuilds() {
        return this.guildRepository.getPublicGuilds();
    }
}
