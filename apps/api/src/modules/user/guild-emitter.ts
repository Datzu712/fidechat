import type { ServerToClientEvents } from '@fidechat/shared';
import { Injectable } from '@nestjs/common';

import { SocketEmitter } from '../gateway/socket-emitter.js';
import { UserRepository } from './user.repository.js';

/**
 * Emits an event to every member of a guild. There are no guild rooms (each socket only joins its user's room),
 * so this looks the members up first.
 */
@Injectable()
export class GuildEmitter {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly emitter: SocketEmitter,
    ) {}

    async emitToGuild<E extends keyof ServerToClientEvents>(
        guildId: string,
        event: E,
        ...args: Parameters<ServerToClientEvents[E]>
    ): Promise<void> {
        const members = await this.userRepository.getGuildUsers(guildId);
        this.emitter.emitToUsers(
            members.map((member) => member.id),
            event,
            ...args,
        );
    }
}
