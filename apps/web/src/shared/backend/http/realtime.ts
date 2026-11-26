import {
    type ClientToServerEvents,
    type ServerToClientEvents,
    SocketEvents,
} from '@fidechat/shared';
import { io, type Socket } from 'socket.io-client';

import type { BackendError, RealtimeBackend } from '@/shared/backend/backend';
import { apiClient } from '@/shared/backend/http/api-client';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Delay before checking the session again while Keycloak or the API is unavailable. */
const RETRY_MS = 5000;

let socket: AppSocket | undefined;
/** Whether the app wants the socket open: a late session check must not reopen it. */
let active = false;
// At most one pending session check; disconnect() cancels it.
let retry: ReturnType<typeof setTimeout> | undefined;
const connectionListeners = new Set<(connected: boolean) => void>();

function setConnected(connected: boolean) {
    connectionListeners.forEach((listener) => listener(connected));
}

function retryLater() {
    clearTimeout(retry);
    retry = setTimeout(recheckSession, RETRY_MS);
}

// The server closes the socket when its session ends and refuses the handshake without a
// valid session (sessions live in memory, so an API restart ends them). Reconnect while the
// session is valid; log in again when it is gone; retry later while Keycloak or the API is
// unavailable.
// apiClient sends the user to /login on a 401.
function recheckSession() {
    retry = undefined;
    apiClient.get('/auth/me').then(
        () => {
            if (active) socket?.connect();
        },
        (error: BackendError) => {
            if (active && error.status !== 401) retryLater();
        },
    );
}

function getSocket(): AppSocket {
    if (socket) return socket;

    // Same origin as the page: the handshake carries the BFF session cookie.
    const created: AppSocket = io({
        autoConnect: false,
        // Keep trying while the API is down (backoff from 1 s up to 5 s).
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ['websocket', 'polling', 'webtransport'],
        timeout: 10000,
    });

    if (import.meta.env.DEV) {
        created.onAny((event, ...args) => {
            console.debug('[socket] received:', event, args);
        });
        created.onAnyOutgoing((event, ...args) => {
            console.debug('[socket] sent:', event, args);
        });
    }

    created.on('connect', () => {
        setConnected(true);
    });
    created.on('disconnect', (reason) => {
        setConnected(false);
        if (reason === 'io server disconnect') recheckSession();
    });
    created.on('connect_error', (err: Error) => {
        setConnected(false);
        console.error('Socket connection error:', err);
        if (err.message === 'Unauthorized') recheckSession();
        else if (err.message === 'Service unavailable') retryLater();
    });

    socket = created;
    return created;
}

export const realtimeBackend: RealtimeBackend = {
    connect() {
        active = true;
        getSocket().connect();
    },

    disconnect() {
        active = false;
        clearTimeout(retry);
        retry = undefined;
        socket?.disconnect();
        setConnected(false);
    },

    onConnectionChange(listener) {
        connectionListeners.add(listener);
        return () => {
            connectionListeners.delete(listener);
        };
    },

    on(event, handler) {
        const current = getSocket();
        // The socket's listener types do not resolve a generic event name, so
        // widen both to the unions.
        const name: keyof ServerToClientEvents = event;
        const listener: ServerToClientEvents[keyof ServerToClientEvents] =
            handler;
        current.on(name, listener);
        // Remove only this handler: other listeners may share the event.
        return () => {
            current.off(name, listener);
        };
    },

    updateStatus(update) {
        getSocket().emit(SocketEvents.UPDATE_CURRENT_STATUS, update);
    },
};
