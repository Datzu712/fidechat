'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import useSocket from '@/hooks/useSocket';
import { useApiMutation } from '@/lib/hooks/useApiQuery';
import type {
    AppUser,
    GuildMember,
    GuildWithMembers,
    ChannelWithMessages,
    Message,
} from '@/types';
import {
    type SyncAppStateResponse,
    AppContextType,
    AppContext,
} from '../appContext';
import { useSocketEvents } from '@/hooks/useSocketsEvents';
import { SocketEvents } from '@/constants/socketEvents';

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

                setUsers(() => {
                    const updatedUsers = data.users || [];
                    if (
                        data.currentUser &&
                        !updatedUsers.some(
                            (user) => user.id === data.currentUser?.id,
                        )
                    ) {
                        updatedUsers.push(data.currentUser);
                    }
                    return updatedUsers;
                });
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

    const handleGuildCreate = useCallback((newGuild: GuildWithMembers) => {
        setGuilds((prevGuilds) => [...prevGuilds, newGuild]);
    }, []);

    const handleChannelCreate = useCallback(
        (newChannel: ChannelWithMessages) => {
            setChannels((prevChannels) => [
                ...prevChannels,
                { ...newChannel, messages: [] },
            ]);
        },
        [],
    );

    const handleForceSync = useCallback(() => {
        syncAppState.mutate();
    }, [syncAppState]);

    const handleMemberAdd = useCallback(
        ({
            user,
            memberMetadata,
        }: {
            user: AppUser;
            memberMetadata: GuildMember;
        }) => {
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
        [],
    );

    const handleMessageCreate = useCallback((newMessage: Message) => {
        setChannels((prevChannels) => {
            const targetChannel = prevChannels.find(
                (channel) => channel.id === newMessage.channelId,
            );

            if (!targetChannel) return prevChannels;

            return prevChannels.map((channel) =>
                channel.id === targetChannel.id
                    ? {
                          ...channel,
                          messages: [...channel.messages, newMessage],
                      }
                    : channel,
            );
        });
    }, []);

    const handleMessageUpdate = useCallback(
        ({ id: messageId, content }: { id: string; content: string }) => {
            setChannels((prevChannels) => {
                const targetChannel = prevChannels.find((channel) =>
                    channel.messages.some(
                        (message) => message.id === messageId,
                    ),
                );

                if (!targetChannel) {
                    console.error(
                        `Couldn't find channel for message ${messageId}`,
                    );
                    return prevChannels;
                }

                return prevChannels.map((channel) =>
                    channel.id === targetChannel.id
                        ? {
                              ...channel,
                              messages: channel.messages.map((message) =>
                                  message.id === messageId
                                      ? { ...message, content }
                                      : message,
                              ),
                          }
                        : channel,
                );
            });
        },
        [],
    );

    const handleMessageDelete = useCallback(
        (data: { id: string; channelId: string }) => {
            const { id: messageId, channelId } = data;

            console.log(data);
            setChannels((prevChannels) => {
                const targetChannel = prevChannels.find(
                    (channel) => channel.id === channelId,
                );
                if (!targetChannel) {
                    console.error(
                        `Couldn't delete message ${messageId} from channel ${channelId}`,
                    );
                    return prevChannels;
                }

                return prevChannels.map((channel) =>
                    channel.id === targetChannel.id
                        ? {
                              ...channel,
                              messages: channel.messages.filter(
                                  (message) => message.id !== messageId,
                              ),
                          }
                        : channel,
                );
            });
        },
        [],
    );

    useEffect(() => {
        if (connected) {
            syncAppState.mutate();
        }
    }, [connected]);

    useSocketEvents(socket, connected, {
        [SocketEvents.GUILD_CREATE]: handleGuildCreate,
        [SocketEvents.CHANNEL_CREATE]: handleChannelCreate,
        [SocketEvents.FORCE_SYNC]: handleForceSync,
        [SocketEvents.MEMBER_ADD]: handleMemberAdd,
        [SocketEvents.MESSAGE_CREATE]: handleMessageCreate,
        [SocketEvents.MESSAGE_UPDATE]: handleMessageUpdate,
        [SocketEvents.MESSAGE_DELETE]: handleMessageDelete,
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
