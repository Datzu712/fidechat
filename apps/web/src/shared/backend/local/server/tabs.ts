import { SocketEvents } from '@fidechat/shared';

import type { ServerCore } from '@/shared/backend/local/server/core';

// Presence per tab: who each tab says hello as, its status updates, and its
// departure once its lock is free.

export interface Tabs {
    hello(tabId: string, userId: string | null): void;
    status(tabId: string, update: unknown): void;
    /** Posts the active users to every tab when `changed`. */
    broadcastPresence(changed: boolean): void;
}

export function createTabs(core: ServerCore): Tabs {
    const watched = new Set<string>();

    const hello = (tabId: string, userId: string | null) => {
        const changed = core.presence.register(tabId, userId);
        core.deps.post({ type: 'welcome', tabId });
        broadcastPresence(changed);

        if (watched.has(tabId)) return;
        watched.add(tabId);
        core.deps.watchTab(tabId, () => {
            void core.enqueue(() => {
                watched.delete(tabId);
                broadcastPresence(core.presence.unregister(tabId));
            });
        });
    };

    const status = (tabId: string, update: unknown) => {
        broadcastPresence(core.presence.update(tabId, update));
    };

    const broadcastPresence = (changed: boolean) => {
        if (!changed) return;
        core.broadcast(
            SocketEvents.USER_STATUS_UPDATE,
            core.presence.activeUsers,
        );
    };

    return { hello, status, broadcastPresence };
}
