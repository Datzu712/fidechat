import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';

import { GatewayService, SocketEvents } from '../gateway/gateway.service';
import { GuildDto } from './dto/guild.dto';
import { GuildRepository } from './guild.repository';

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
