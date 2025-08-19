'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import useSocket from '@/hooks/useSocket';
import { useApiMutation } from '@/lib/hooks/useApiQuery';
import type {
    AppUser,
    GuildMember,
    GuildWithMembers,
    ChannelWithMessages,
} from '@/types';
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
    const [channels, setChannels] = useState<ChannelWithMessages[]>([]);
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
        onGuildCreate: (newGuild) => {
            setGuilds((prevGuilds) => [...prevGuilds, newGuild]);
        },
        onChannelCreate: (newChannel) => {
            setChannels((prevChannels) => [
                ...prevChannels,
                { ...newChannel, messages: [] },
            ]);
        },
        onForceSync: () => {
            syncAppState.mutate();
        },
        onMemberAdd: ({ user, memberMetadata }) => {
            setServerMembers((prevMembers) => [...prevMembers, memberMetadata]);
            setUsers((prevUsers) => [...prevUsers, user]);

            setGuilds((prevGuilds) => {
                const guild = prevGuilds.find(
                    (g) => g.id === memberMetadata.guildId,
                );
                if (guild) {
                    return prevGuilds.map((g) =>
                        g.id === guild.id
                            ? { ...g, members: [...g.members, memberMetadata] }
                            : g,
                    );
                }
                return prevGuilds;
            });
        },
        onMessageCreate: (newMessage) => {
            const targetChannel = channels.find(
                (channel) => channel.id === newMessage.channelId,
            );

            if (targetChannel) {
                targetChannel.messages.push(newMessage);

                setChannels((prevChannels) =>
                    prevChannels.map((channel) =>
                        channel.id === targetChannel.id
                            ? { ...channel, messages: [...channel.messages] }
                            : channel,
                    ),
                );
            }
        },
    });

    const value = useMemo<AppContextType>(
        () => ({
            currentUser,
            users,
            guilds,
            channels,
            serverMembers,
            setCurrentUser,
            setUsers,
            setGuilds,
            setChannels,
            setServerMembers,
            syncAppState,
            getServerChannels,
        }),
        [
            channels,
            currentUser,
            getServerChannels,
            guilds,
            serverMembers,
            syncAppState,
            users,
        ],
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
