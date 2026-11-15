import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { ServerToClientEvents } from '@fidechat/shared';

type SocketEventHandlers = Partial<ServerToClientEvents>;

export function useSocketEvents(
    socket: React.RefObject<Socket | null>,
    connected: boolean,
    handlers: SocketEventHandlers,
) {
    useEffect(() => {
        const currentSocket = socket.current;
        if (!connected || !currentSocket) return;

        console.debug(
            `Registering the following events: ${Object.keys(handlers).join(', ')}`,
        );

        Object.entries(handlers).forEach(([event, handler]) => {
            if (handler) {
                currentSocket.on(event, handler);
            }
        });

        return () => {
            if (currentSocket) {
                // Remover solo los eventos que fueron registrados
                Object.keys(handlers).forEach((event) => {
                    currentSocket.off(event);
                });
            }
        };
    }, [socket, connected, handlers]);
}
