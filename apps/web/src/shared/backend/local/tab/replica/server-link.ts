import type { ServerToClientEvents } from '@fidechat/shared';

import type {
    LocalRequest,
    ServerMessage,
} from '@/shared/backend/local/protocol';
import {
    leave,
    storedUserId,
} from '@/shared/backend/local/tab/replica/session';
import { getTab, type Tab } from '@/shared/backend/local/tab/replica/worker';

// The tab's link to the server worker: what the server sends it, its
// connection state and event handlers, and the requests the tab sends.

/** Handles one message from the server; `replica.ts` wires it to the channel. */
export function receive(current: Tab, message: ServerMessage) {
    switch (message.type) {
        case 'ready':
            current.requester.serverReady();
            return;
        case 'welcome':
            if (message.tabId !== current.tabId || connected) return;
            connected = true;
            connectionListeners.forEach((listener) => listener(true));
            return;
        case 'response':
            current.requester.settle(message);
            return;
        case 'event': {
            const userId = storedUserId();
            const forTab =
                message.to === 'all' ||
                (userId !== null && message.to.includes(userId));
            if (!forTab) return;
            handlers
                .get(message.event)
                ?.forEach((handler) => handler(message.payload));
            return;
        }
        case 'reset':
            leave();
            return;
    }
}

/** Starts the tab, and tells the listeners again if it is already connected. */
export function connect() {
    getTab();
    if (connected) connectionListeners.forEach((listener) => listener(true));
}

/** Returns the unsubscribe function. */
export function onConnectionChange(listener: (connected: boolean) => void) {
    connectionListeners.add(listener);
    return () => {
        connectionListeners.delete(listener);
    };
}

/** Returns the unsubscribe function. */
export function on<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E],
) {
    const set = handlers.get(event) ?? new Set<AnyHandler>();
    handlers.set(event, set);

    const listener = handler as AnyHandler;
    set.add(listener);

    return () => {
        set.delete(listener);
    };
}

export function request<T>(message: LocalRequest) {
    return getTab().requester.request<T>(message);
}

type AnyHandler = (payload: unknown) => void;

let connected = false;
const connectionListeners = new Set<(connected: boolean) => void>();
const handlers = new Map<keyof ServerToClientEvents, Set<AnyHandler>>();
