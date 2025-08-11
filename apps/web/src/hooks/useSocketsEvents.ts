import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Guild } from '@/types';
import { SocketEvents } from '@/constants/socketEvents';

type SocketEventHandlers = {
    onGuildCreated?: (guild: Guild) => void;
};

export function useSocketEvents(
    socket: React.RefObject<Socket | null>,
    connected: boolean,
    handlers: SocketEventHandlers,
) {
    useEffect(() => {
        const currentSocket = socket.current;
        if (!connected || !currentSocket) return;

        if (handlers.onGuildCreated) {
            currentSocket.on(
                SocketEvents.GUILD_CREATED,
                handlers.onGuildCreated,
            );
        }

        // Cleanup
        return () => {
            if (currentSocket) {
                for (const event of Object.values(SocketEvents)) {
                    currentSocket.off(event);
                }
            }
        };
    }, [socket, connected, handlers]);
}
