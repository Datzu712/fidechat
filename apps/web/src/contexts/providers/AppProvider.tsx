'use client';

import { useEffect, useState } from 'react';

import useSocket from '@/src/hooks/useSocket';
import { useApiMutation } from '@/src/lib/hooks/useApiQuery';
import type { Channel, Guild, AppUser, GuildMember } from '@/src/types';
import {
    SyncAppStateResponse,
    AppContextType,
    AppContext,
} from '../appContext';

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [messages, setMessages] = useState<object[]>([]);
    const [serverMembers, setServerMembers] = useState<GuildMember[]>([]);
    const [currentGuild, setCurrentGuild] = useState<Guild | null>(null);
    const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

    const syncAppState = useApiMutation<SyncAppStateResponse, void>(
        '/users/@me/sync',
        {
            onSuccess: (data) => {
                if (!data) return;

                setGuilds(data.guilds || []);
                setChannels(data.channels || []);
            },
            method: 'GET',
        },
    );

    const { connected, socket } = useSocket();

    useEffect(() => {
        if (connected) {
            syncAppState.mutate();
        }
    }, [connected]);

    useEffect(() => {
        const currentSocket = socket.current;
        if (!currentSocket) return;

        currentSocket.on('user_updated', (updatedUser: AppUser) => {
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === updatedUser.id ? updatedUser : user,
                ),
            );
        });

        currentSocket.on('guild_updated', (updatedGuild: Guild) => {
            setGuilds((prevGuilds) =>
                prevGuilds.map((guild) =>
                    guild.id === updatedGuild.id ? updatedGuild : guild,
                ),
            );
        });

        currentSocket.on('channel_updated', (updatedChannel: Channel) => {
            setChannels((prevChannels) =>
                prevChannels.map((channel) =>
                    channel.id === updatedChannel.id ? updatedChannel : channel,
                ),
            );
        });

        currentSocket.on('message_received', (newMessage: object) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        });

        return () => {
            if (currentSocket) {
                currentSocket.off('user_updated');
                currentSocket.off('guild_updated');
                currentSocket.off('channel_updated');
                currentSocket.off('message_received');
            }
        };
    }, [socket]);

    const value: AppContextType = {
        currentUser,
        users,
        guilds,
        channels,
        messages,
        serverMembers,
        setCurrentUser,
        setUsers,
        setGuilds,
        setChannels,
        setMessages,
        setServerMembers,
        currentGuild,
        setCurrentGuild,
        currentChannel,
        setCurrentChannel,
        syncAppState,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
