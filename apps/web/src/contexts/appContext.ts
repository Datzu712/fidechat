import { createContext } from 'react';
import type { Channel, Guild, AppUser, GuildMember } from '@/src/types';
import type { UseMutationResult } from '@tanstack/react-query';

export type SyncAppStateResponse = {
    guilds: Guild[];
    channels: Channel[];
};

export type AppContextType = {
    currentUser: AppUser | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
    users: AppUser[];
    setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
    guilds: Guild[];
    setGuilds: React.Dispatch<React.SetStateAction<Guild[]>>;
    channels: Channel[];
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
    messages: object[];
    setMessages: React.Dispatch<React.SetStateAction<object[]>>;
    serverMembers: GuildMember[];
    setServerMembers: React.Dispatch<React.SetStateAction<GuildMember[]>>;
    currentGuild: Guild | null;
    setCurrentGuild: React.Dispatch<React.SetStateAction<Guild | null>>;
    currentChannel: Channel | null;
    setCurrentChannel: React.Dispatch<React.SetStateAction<Channel | null>>;
    syncAppState: UseMutationResult<SyncAppStateResponse, Error, void>;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);
