import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Channel, GuildWithMembers } from '@/types';
import { SocketEvents } from '@/constants/socketEvents';

type SocketEventHandlers = {
    onGuildCreate?: (guild: GuildWithMembers) => void;
    onChannelCreate?: (channel: Channel) => void;
};

export function useSocketEvents(
    socket: React.RefObject<Socket | null>,
    connected: boolean,
    handlers: SocketEventHandlers,
) {
    useEffect(() => {
        const currentSocket = socket.current;
        if (!connected || !currentSocket) return;

        if (handlers.onGuildCreate) {
            currentSocket.on(SocketEvents.GUILD_CREATE, handlers.onGuildCreate);
        }

        if (handlers.onChannelCreate) {
            currentSocket.on(
                SocketEvents.CHANNEL_CREATE,
                handlers.onChannelCreate,
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
