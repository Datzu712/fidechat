import type { ServerToClientEvents } from '@fidechat/shared';
import { useEffect } from 'react';

import { backend } from '@/shared/backend/implementation';

type SocketEventHandlers = Partial<ServerToClientEvents>;

export function useSocketEvents(
    connected: boolean,
    handlers: SocketEventHandlers,
) {
    useEffect(() => {
        if (!connected) return;

        // Object.keys loses the key type; the handlers map is keyed by event name.
        const events = Object.keys(handlers) as Array<
            keyof ServerToClientEvents
        >;

        const unsubscribers = events.flatMap((event) => {
            const handler = handlers[event];
            return handler ? [backend.on(event, handler)] : [];
        });

        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [connected, handlers]);
}
