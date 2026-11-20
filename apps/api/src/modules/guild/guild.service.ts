import { SocketEvents } from '@fidechat/shared';
import { Injectable } from '@nestjs/common';

import { SocketEmitter } from '../gateway/socket-emitter.js';
import { GuildDto } from './dto/guild.dto.js';
import { GuildRepository } from './guild.repository.js';

@Injectable()
export class GuildService {
    constructor(
        private readonly guildRepository: GuildRepository,
        private readonly emitter: SocketEmitter,
    ) {}

    public async createGuild(ownerId: string, dto: GuildDto) {
        const created = await this.guildRepository.createGuild(ownerId, dto);

        // The repository adds the owner as the only member in the same transaction.
        this.emitter.emitToUser(ownerId, SocketEvents.GUILD_CREATE, { ...created, members: [{ userId: ownerId }] });

        return { id: created.id, success: true };
    }

    public async getPublicGuilds() {
        return this.guildRepository.getPublicGuilds();
    }
}
