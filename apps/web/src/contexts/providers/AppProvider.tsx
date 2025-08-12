'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import useSocket from '@/hooks/useSocket';
import { useApiMutation } from '@/lib/hooks/useApiQuery';
import type { Channel, AppUser, GuildMember, GuildWithMembers } from '@/types';
import {
    type SyncAppStateResponse,
    AppContextType,
    AppContext,
} from '../appContext';
import { useSocketEvents } from '@/hooks/useSocketsEvents';

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [users, setUsers] = useState<Omit<AppUser, 'email'>[]>([]);
    const [guilds, setGuilds] = useState<GuildWithMembers[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [messages, setMessages] = useState<object[]>([]);
    const [serverMembers, setServerMembers] = useState<GuildMember[]>([]);

    const syncAppState = useApiMutation<SyncAppStateResponse, void>(
        '/users/@me/sync',
        {
            onSuccess: (data) => {
                if (!data) return;

                console.log(data);

                setUsers(data.users || []);
                setGuilds(data.guilds || []);
                setChannels(data.channels || []);
                setCurrentUser(data.currentUser || null);
            },
            method: 'GET',
        },
    );

    const getServerChannels = useCallback(
        (serverId: string) => {
            return channels.filter((channel) => channel.guildId === serverId);
        },
        [channels],
    );

    const { connected, socket } = useSocket();

    useEffect(() => {
        if (connected) {
            syncAppState.mutate();
        }
    }, [connected]);

    useSocketEvents(socket, connected, {
        onGuildCreate: (newGuild: GuildWithMembers) => {
            setGuilds((prevGuilds) => [...prevGuilds, newGuild]);
        },
        onChannelCreate: (newChannel: Channel) => {
            setChannels((prevChannels) => [...prevChannels, newChannel]);
        },
    });

    const value = useMemo<AppContextType>(
        () => ({
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
            syncAppState,
            getServerChannels,
        }),
        [
            channels,
            currentUser,
            getServerChannels,
            guilds,
            messages,
            serverMembers,
            syncAppState,
            users,
        ],
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
