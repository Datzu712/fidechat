import type { ServerToClientEvents } from '@fidechat/shared';
import { useEffect } from 'react';

import type { AppSocket } from '@/shared/socket/socket-context';

type SocketEventHandlers = Partial<ServerToClientEvents>;

export function useSocketEvents(
    socket: React.RefObject<AppSocket | null>,
    connected: boolean,
    handlers: SocketEventHandlers,
) {
    useEffect(() => {
        const currentSocket = socket.current;
        if (!connected || !currentSocket) return;

        // Object.keys loses the key type; the handlers map is keyed by event name.
        const events = Object.keys(handlers) as Array<
            keyof ServerToClientEvents
        >;

        events.forEach((event) => {
            const handler = handlers[event];
            if (handler) {
                currentSocket.on(event, handler);
            }
        });

        return () => {
            // Remove only these handlers: other listeners may share the event.
            events.forEach((event) => {
                currentSocket.off(event, handlers[event]);
            });
        };
    }, [socket, connected, handlers]);
}
