import { createContext } from 'react';
import type {
    Channel,
    AppUser,
    GuildMember,
    GuildWithMembers,
    ChannelWithMessages,
} from '@/types';
import type { UseMutationResult } from '@tanstack/react-query';

export type SyncAppStateResponse = {
    guilds: GuildWithMembers[];
    channels: ChannelWithMessages[];
    currentUser: AppUser;
    users: Omit<AppUser, 'email'>[];
};

export type AppContextType = {
    currentUser: AppUser | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
    users: Omit<AppUser, 'email'>[];
    setUsers: React.Dispatch<React.SetStateAction<Omit<AppUser, 'email'>[]>>;
    guilds: GuildWithMembers[];
    setGuilds: React.Dispatch<React.SetStateAction<GuildWithMembers[]>>;
    channels: ChannelWithMessages[];
    setChannels: React.Dispatch<React.SetStateAction<ChannelWithMessages[]>>;
    serverMembers: GuildMember[];
    setServerMembers: React.Dispatch<React.SetStateAction<GuildMember[]>>;
    syncAppState: UseMutationResult<SyncAppStateResponse, Error, void>;
    getServerChannels: (serverId: string) => Channel[];
};

export const AppContext = createContext<AppContextType | undefined>(undefined);
