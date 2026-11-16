import { useEffect } from 'react';
import type { ServerToClientEvents } from '@fidechat/shared';
import type { AppSocket } from '@/contexts/socketContext';

type SocketEventHandlers = Partial<ServerToClientEvents>;

export function useSocketEvents(
    socket: React.RefObject<AppSocket | null>,
    connected: boolean,
    handlers: SocketEventHandlers,
) {
    useEffect(() => {
        const currentSocket = socket.current;
        if (!connected || !currentSocket) return;

        console.debug(
            `Registering the following events: ${Object.keys(handlers).join(', ')}`,
        );

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
            if (currentSocket) {
                // Remover solo los eventos que fueron registrados
                events.forEach((event) => {
                    currentSocket.off(event);
                });
            }
        };
    }, [socket, connected, handlers]);
}
