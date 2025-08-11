'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import useSocket from '@/hooks/useSocket';
import { useApiMutation } from '@/lib/hooks/useApiQuery';
import type { Channel, Guild, AppUser, GuildMember } from '@/types';
import {
    type SyncAppStateResponse,
    AppContextType,
    AppContext,
} from '../appContext';
import { useSocketEvents } from '@/hooks/useSocketsEvents';

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

                console.log(data.currentUser);

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
        onGuildCreated: (newGuild: Guild) => {
            setGuilds((prevGuilds) => [...prevGuilds, newGuild]);
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
            currentGuild,
            setCurrentGuild,
            currentChannel,
            setCurrentChannel,
            syncAppState,
            getServerChannels,
        }),
        [
            channels,
            currentChannel,
            currentGuild,
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
