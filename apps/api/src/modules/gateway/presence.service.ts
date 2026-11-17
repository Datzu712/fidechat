import { type ConnectedUser, SocketEvents } from '@fidechat/shared';
import { Injectable, Logger } from '@nestjs/common';

import { BOTS } from '../ai/bots.js';
import { SocketEmitter } from './socket-emitter.js';
import { parseStatusUpdate } from './status-update.util.js';

/**
 * Who is online, in memory (assumes a single API instance). The AI bots are always online. Every change
 * is broadcast to all sockets as `USER_STATUS_UPDATE` with the full list.
 */
@Injectable()
export class PresenceService {
    private readonly logger = new Logger(PresenceService.name);
    readonly #activeUsers = new Map<string, Omit<ConnectedUser, 'userId'>>();
    /** Channels each bot is typing in, oldest first; presence shows the latest one. */
    readonly #botTyping = new Map<string, string[]>();

    constructor(private readonly emitter: SocketEmitter) {
        for (const { user } of BOTS) {
            this.#activeUsers.set(user.id, {
                status: 'online',
                isTyping: false,
            });
        }
    }

    /**
     * Retrieves a list of active users and their statuses.
     * Converts the internal map of active users into an array of objects,
     * where each object contains the user ID and their corresponding status.
     *
     * @returns An array of objects, each containing:
     * - `userId`: The unique identifier of the user.
     * - `status`: The current status of the user.
     */
    get activeUsers(): ConnectedUser[] {
        return Array.from(this.#activeUsers.entries()).map(([userId, data]) => ({
            ...data,
            userId,
        }));
    }

    public setOnline(userId: string) {
        this.#activeUsers.set(userId, {
            status: 'online',
            isTyping: false,
        });
        this.broadcast();
    }

    public setOffline(userId: string) {
        if (this.#activeUsers.delete(userId)) {
            this.broadcast();
        }
    }

    /** `userId` comes from the socket's token, never from `data`. */
    public update(userId: string, data: unknown) {
        const update = parseStatusUpdate(data);
        if (!update) {
            this.logger.warn(`Dropped an invalid status update from user ${userId}`);
            return;
        }

        const current = this.#activeUsers.get(userId);
        if (current) {
            this.#activeUsers.set(userId, { ...current, ...update });
            this.broadcast();
        }
    }

    public startBotTyping(botId: string, channelId: string) {
        const user = BOTS.find((bot) => bot.user.id === botId)?.user;
        if (!user) {
            this.logger.error(`IA user with ID ${botId} not found`);
            return;
        }

        this.#botTyping.set(user.id, [...(this.#botTyping.get(user.id) ?? []), channelId]);
        this.setBotTyping(user.id);
    }

    /** A bot can type in several channels at once: the indicator moves to another one until all have finished. */
    public stopBotTyping(botId: string, channelId: string) {
        const user = BOTS.find((bot) => bot.user.id === botId)?.user;
        if (!user) {
            this.logger.error(`IA user with ID ${botId} not found`);
            return;
        }
        const channels = this.#botTyping.get(user.id) ?? [];
        const index = channels.indexOf(channelId);
        if (index === -1) return;

        this.#botTyping.set(user.id, channels.toSpliced(index, 1));
        this.setBotTyping(user.id);
    }

    private setBotTyping(botId: string) {
        const channelId = this.#botTyping.get(botId)?.at(-1);
        this.#activeUsers.set(botId, {
            status: 'online',
            isTyping: channelId !== undefined,
            typingInChannel: channelId,
        });
        this.broadcast();
    }

    private broadcast() {
        this.emitter.broadcast(SocketEvents.USER_STATUS_UPDATE, this.activeUsers);
    }
}
