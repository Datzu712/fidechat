import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type {
    AppUser,
    ChannelWithMessages,
    GuildMember,
    GuildWithMembers,
    Message,
} from '@/types';
import { SocketEvents } from '@/constants/socketEvents';
type SocketEventHandlers = {
    [SocketEvents.GUILD_CREATE]?: (guild: GuildWithMembers) => void;
    [SocketEvents.CHANNEL_CREATE]?: (channel: ChannelWithMessages) => void;
    [SocketEvents.MEMBER_ADD]?: (data: {
        user: AppUser;
        memberMetadata: GuildMember;
    }) => void;
    [SocketEvents.FORCE_SYNC]?: () => void;
    [SocketEvents.MESSAGE_CREATE]?: (data: Message) => void;
    [SocketEvents.MESSAGE_UPDATE]?: (data: {
        id: string;
        content: string;
    }) => void;
    [SocketEvents.MESSAGE_DELETE]?: (data: {
        id: string;
        channelId: string;
    }) => void;
};

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
