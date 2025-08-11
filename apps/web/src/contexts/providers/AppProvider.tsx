'use client';

import { useEffect, useState } from 'react';

import useSocket from '@/hooks/useSocket';
import { useApiMutation } from '@/lib/hooks/useApiQuery';
import type { Channel, Guild, AppUser, GuildMember } from '@/types';
import {
    SyncAppStateResponse,
    AppContextType,
    AppContext,
} from '../appContext';
import { SocketEvents } from '@/constants/socketEvents';

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
        if (!connected || !currentSocket) return;

        currentSocket.on(SocketEvents.GUILD_CREATED, (newGuild: Guild) => {
            console.log('New guild created:', newGuild);
            setGuilds((prevGuilds) => [...prevGuilds, newGuild]);
        });

        return () => {
            if (currentSocket) {
                console.log('Cleaning up socket listeners');

                for (const event of Object.values(SocketEvents)) {
                    currentSocket.off(event);
                }
            }
        };
    }, [socket, connected]);

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
