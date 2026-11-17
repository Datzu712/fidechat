import type {
    Channel,
    AppUser,
    GuildMember,
    GuildWithMembers,
    ChannelWithMessages,
    ConnectedUser,
    SyncPayload,
    UserStatus,
} from '@fidechat/shared';
import type { UseMutationResult } from '@tanstack/react-query';
import { createContext } from 'react';

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
    syncAppState: UseMutationResult<SyncPayload, Error, void>;
    getServerChannels: (serverId: string) => Channel[];
    connectedUsers: ConnectedUser[];
    setConnectedUsers: React.Dispatch<React.SetStateAction<ConnectedUser[]>>;
    getUserStatus: (userId: string) => UserStatus | undefined;
    getUserById: (userId: string) => Omit<AppUser, 'email'> | undefined;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);
