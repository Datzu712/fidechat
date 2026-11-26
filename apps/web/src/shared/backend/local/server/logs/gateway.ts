import { BOT_DEFINITIONS, type Message, SocketEvents } from '@fidechat/shared';

import type { ServerMessage } from '@/shared/backend/local/protocol';
import { stringify } from '@/shared/backend/local/server/logs/format';
import type { Logger } from '@/shared/backend/local/server/logs/logger';

// The socket side: each tab is a socket that connects as its user, sends
// status updates and receives the emitted events.

type EventMessage = Extract<ServerMessage, { type: 'event' }>;

const BOT_NAMES = new Map(
    BOT_DEFINITIONS.map(({ user }) => [user.id, user.username]),
);

export interface GatewayLogs {
    /** A tab said hello; logged only when its user changes. */
    hello(tabId: string, userId: string | null): void;
    status(tabId: string, update: unknown): void;
    /** The tab closed. */
    gone(tabId: string): void;
    emitted(message: EventMessage): void;
}

export function createGatewayLogs(logger: Logger): GatewayLogs {
    const gateway = logger.context('SocketGateway');
    const emitter = logger.context('SocketEmitter');
    const bots = logger.context('BotConversationService');
    /** The user each connected tab said hello as. */
    const users = new Map<string, string>();

    const hello = (tabId: string, userId: string | null) => {
        if ((users.get(tabId) ?? null) === userId) return;
        if (userId === null) return gone(tabId);

        users.set(tabId, userId);
        const user = stringify({ sub: userId });
        gateway.debug(
            `Socket ${tabId} connected with user data: ${user} (local - socket: ${tabId})`,
        );
    };

    const status = (tabId: string, update: unknown) => {
        gateway.debug(`User ${tabId} updated status to: ${stringify(update)}`);
    };

    const gone = (tabId: string) => {
        if (users.delete(tabId)) {
            gateway.debug(`Socket ${tabId} disconnected.`);
        }
    };

    const emitted = ({ to, event, payload }: EventMessage) => {
        emitter.debug(
            to === 'all'
                ? `Broadcasting event ${event}`
                : `Emitting event ${event} to users: ${to.join(', ')}`,
        );

        if (event !== SocketEvents.MESSAGE_CREATE) return;
        const { authorId, channelId, content } = payload as Message;
        const bot = BOT_NAMES.get(authorId);
        if (bot) {
            bots.debug(
                `Channel ${channelId}: ${bot} replied (${content.length} chars)`,
            );
        }
    };

    return { hello, status, gone, emitted };
}
