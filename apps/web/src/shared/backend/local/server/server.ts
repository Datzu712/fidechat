import { SocketEvents } from '@fidechat/shared';

import type {
    ServerMessage,
    TabMessage,
} from '@/shared/backend/local/protocol';
import type { BotResponderDeps } from '@/shared/backend/local/server/bots/bots';
import { connectBots } from '@/shared/backend/local/server/bots/connect-bots';
import { createCore } from '@/shared/backend/local/server/core';
import type { SnapshotStore } from '@/shared/backend/local/server/data/store';
import { createRequests } from '@/shared/backend/local/server/requests';
import { createTabs } from '@/shared/backend/local/server/tabs';

// The local server's entrypoint: builds the core, wires the tabs, the bots
// and the requests to it, and hands each tab message to one of them.

export interface ServerDeps {
    post(message: ServerMessage): void;
    store: SnapshotStore;
    /** Calls `onGone` once when the tab's lock becomes free. */
    watchTab(tabId: string, onGone: () => void): void;
    newId(): string;
    now(): Date;
    /** The bots' language model; resolves null when no model is ready. */
    generate: BotResponderDeps['generate'];
}

export interface LocalServer {
    handle(message: TabMessage): Promise<void>;
}

/**
 * The local backend: applies the rules to one state, saves it after each
 * write and before posting that write's events, and tracks presence. The user
 * of a request is the one its tab said hello with, never one in the request.
 * The bots named in a human message answer through their own queue, so
 * generating never blocks requests; their posts go through the server's.
 */
export async function createServer(deps: ServerDeps): Promise<LocalServer> {
    const core = await createCore(deps);
    const tabs = createTabs(core);
    const bots = connectBots({ core, tabs });
    const requests = createRequests({ core, bots });

    deps.post({ type: 'ready' });
    core.broadcast(SocketEvents.FORCE_SYNC, undefined);

    return {
        handle(message) {
            return core.enqueue(() => {
                switch (message.type) {
                    case 'hello':
                        return tabs.hello(message.tabId, message.userId);
                    case 'status':
                        return tabs.status(message.tabId, message.update);
                    case 'request':
                        return requests.handle(message);
                }
            });
        },
    };
}
