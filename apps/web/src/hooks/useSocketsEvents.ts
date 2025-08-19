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
    onGuildCreate?: (guild: GuildWithMembers) => void;
    onChannelCreate?: (channel: ChannelWithMessages) => void;
    onMemberAdd?: (data: {
        user: AppUser;
        memberMetadata: GuildMember;
    }) => void;
    onForceSync?: () => void;
    onMessageCreate?: (data: Message) => void;
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

        if (handlers.onMemberAdd) {
            currentSocket.on(SocketEvents.MEMBER_ADD, handlers.onMemberAdd);
        }

        if (handlers.onForceSync) {
            currentSocket.on(SocketEvents.FORCE_SYNC, handlers.onForceSync);
        }

        if (handlers.onMessageCreate) {
            currentSocket.on(
                SocketEvents.MESSAGE_CREATE,
                handlers.onMessageCreate,
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
