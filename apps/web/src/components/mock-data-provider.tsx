'use client';

import federatedLogout from '@/lib/federated-logout';
import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

export type User = {
    id: string;
    email: string;
    username: string;
    avatar_url: string | null;
    status: 'online' | 'offline' | 'away' | 'busy';
};

export type Server = {
    id: string;
    name: string;
    image_url: string | null;
    owner_id: string;
    invite_code: string;
    created_at: string;
};

export type Channel = {
    id: string;
    name: string;
    server_id: string;
    type: 'TEXT' | 'VOICE';
    created_at: string;
};

export type Message = {
    id: string;
    content: string;
    channel_id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
};

// Update the ServerMember type to include more information
export type ServerMember = {
    id: string;
    server_id: string;
    user_id: string;
    role: 'ADMIN' | 'MEMBER';
    created_at: string;
    nickname?: string; // Optional nickname for the server
};

type MockDataContextType = {
    currentUser: User | null;
    users: User[];
    servers: Server[];
    channels: Channel[];
    messages: Message[];
    serverMembers: ServerMember[];
    login: (email: string, password: string) => Promise<boolean>;
    register: (
        email: string,
        username: string,
        password: string,
    ) => Promise<boolean>;
    logout: () => void;
    createServer: (name: string) => Promise<Server>;
    createChannel: (name: string, serverId: string) => Promise<Channel>;
    sendMessage: (content: string, channelId: string) => Promise<Message>;
    getUserServers: (userId: string) => Server[];
    getServerChannels: (serverId: string) => Channel[];
    getChannelMessages: (channelId: string) => Message[];
    isUserServerMember: (userId: string, serverId: string) => boolean;
    isUserServerAdmin: (userId: string, serverId: string) => boolean;
    getServerMembers: (serverId: string) => (ServerMember & { user: User })[]; // Add this line
};

const MockDataContext = createContext<MockDataContextType | undefined>(
    undefined,
);

// Mock data
const mockUsers: User[] = [
    {
        id: 'user-1',
        email: 'john@example.com',
        username: 'john_doe',
        avatar_url: null,
        status: 'online',
    },
    {
        id: 'user-2',
        email: 'jane@example.com',
        username: 'jane_smith',
        avatar_url: null,
        status: 'online',
    },
    {
        id: 'user-3',
        email: 'bob@example.com',
        username: 'bob_wilson',
        avatar_url: null,
        status: 'away',
    },
    {
        id: 'user-4',
        email: 'alice@example.com',
        username: 'alice_cooper',
        avatar_url: null,
        status: 'busy',
    },
    {
        id: 'user-5',
        email: 'charlie@example.com',
        username: 'charlie_brown',
        avatar_url: null,
        status: 'offline',
    },
];

const mockServers: Server[] = [
    // {
    //     id: 'server-1',
    //     name: 'Gaming Community',
    //     image_url: null,
    //     owner_id: 'user-1',
    //     invite_code: 'gaming123',
    //     created_at: new Date().toISOString(),
    // },
    // {
    //     id: 'server-2',
    //     name: 'Study Group',
    //     image_url: null,
    //     owner_id: 'user-2',
    //     invite_code: 'study456',
    //     created_at: new Date().toISOString(),
    // },
];

const mockChannels: Channel[] = [
    // {
    //     id: 'channel-1',
    //     name: 'general',
    //     server_id: 'server-1',
    //     type: 'TEXT',
    //     created_at: new Date().toISOString(),
    // },
    // {
    //     id: 'channel-2',
    //     name: 'gaming',
    //     server_id: 'server-1',
    //     type: 'TEXT',
    //     created_at: new Date().toISOString(),
    // },
    // {
    //     id: 'channel-3',
    //     name: 'general',
    //     server_id: 'server-2',
    //     type: 'TEXT',
    //     created_at: new Date().toISOString(),
    // },
    // {
    //     id: 'channel-4',
    //     name: 'homework-help',
    //     server_id: 'server-2',
    //     type: 'TEXT',
    //     created_at: new Date().toISOString(),
    // },
];

const mockMessages: Message[] = [
    // {
    //     id: 'msg-1',
    //     content: 'Welcome to the Gaming Community!',
    //     channel_id: 'channel-1',
    //     user_id: 'user-1',
    //     created_at: new Date(Date.now() - 3600000).toISOString(),
    //     updated_at: new Date(Date.now() - 3600000).toISOString(),
    // },
    // {
    //     id: 'msg-2',
    //     content: 'Hey everyone! Ready for some gaming?',
    //     channel_id: 'channel-1',
    //     user_id: 'user-2',
    //     created_at: new Date(Date.now() - 1800000).toISOString(),
    //     updated_at: new Date(Date.now() - 1800000).toISOString(),
    // },
    // {
    //     id: 'msg-3',
    //     content: 'What games are we playing today?',
    //     channel_id: 'channel-2',
    //     user_id: 'user-3',
    //     created_at: new Date(Date.now() - 900000).toISOString(),
    //     updated_at: new Date(Date.now() - 900000).toISOString(),
    // },
    // {
    //     id: 'msg-4',
    //     content: 'Welcome to our study group!',
    //     channel_id: 'channel-3',
    //     user_id: 'user-2',
    //     created_at: new Date(Date.now() - 7200000).toISOString(),
    //     updated_at: new Date(Date.now() - 7200000).toISOString(),
    // },
];

const mockServerMembers: ServerMember[] = [
    {
        id: 'member-1',
        server_id: 'server-1',
        user_id: 'user-1',
        role: 'ADMIN',
        created_at: new Date().toISOString(),
    },
    {
        id: 'member-2',
        server_id: 'server-1',
        user_id: 'user-2',
        role: 'MEMBER',
        created_at: new Date().toISOString(),
    },
    {
        id: 'member-3',
        server_id: 'server-1',
        user_id: 'user-3',
        role: 'MEMBER',
        created_at: new Date().toISOString(),
    },
    {
        id: 'member-4',
        server_id: 'server-2',
        user_id: 'user-2',
        role: 'ADMIN',
        created_at: new Date().toISOString(),
    },
    {
        id: 'member-5',
        server_id: 'server-2',
        user_id: 'user-1',
        role: 'MEMBER',
        created_at: new Date().toISOString(),
    },
    {
        id: 'member-6',
        server_id: 'server-1',
        user_id: 'user-4',
        role: 'MEMBER',
        created_at: new Date().toISOString(),
    },
    {
        id: 'member-7',
        server_id: 'server-1',
        user_id: 'user-5',
        role: 'MEMBER',
        created_at: new Date().toISOString(),
    },
    {
        id: 'member-8',
        server_id: 'server-2',
        user_id: 'user-3',
        role: 'MEMBER',
        created_at: new Date().toISOString(),
    },
];

// Add a function to get server members with user details
const getServerMembers = (
    serverId: string,
): (ServerMember & { user: User })[] => {
    return mockServerMembers
        .filter((member) => member.server_id === serverId)
        .map((member) => ({
            ...member,
            user: mockUsers.find((user) => user.id === member.user_id)!,
        }))
        .filter((member) => member.user); // Filter out any members without user data
};

export function MockDataProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [servers, setServers] = useState<Server[]>(mockServers);
    const [channels, setChannels] = useState<Channel[]>(mockChannels);
    const [messages, setMessages] = useState<Message[]>(mockMessages);
    const [serverMembers, setServerMembers] =
        useState<ServerMember[]>(mockServerMembers);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('discord-clone-user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setCurrentUser(user);
        }
    }, []);

    const login = async (email: string): Promise<boolean> => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const user = users.find((u) => u.email === email);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem('discord-clone-user', JSON.stringify(user));
            return true;
        }
        return false;
    };

    const register = async (
        email: string,
        username: string,
    ): Promise<boolean> => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check if user already exists
        if (users.find((u) => u.email === email || u.username === username)) {
            return false;
        }

        const newUser: User = {
            id: `user-${Date.now()}`,
            email,
            username,
            avatar_url: null,
            status: 'online',
        };

        setUsers((prev) => [...prev, newUser]);
        setCurrentUser(newUser);
        localStorage.setItem('discord-clone-user', JSON.stringify(newUser));
        return true;
    };

    const createServer = async (name: string): Promise<Server> => {
        if (!currentUser) throw new Error('Not authenticated');

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const newServer: Server = {
            id: `server-${Date.now()}`,
            name,
            image_url: null,
            owner_id: currentUser.id,
            invite_code: Math.random().toString(36).substring(7),
            created_at: new Date().toISOString(),
        };

        const newMember: ServerMember = {
            id: `member-${Date.now()}`,
            server_id: newServer.id,
            user_id: currentUser.id,
            role: 'ADMIN',
            created_at: new Date().toISOString(),
        };

        const generalChannel: Channel = {
            id: `channel-${Date.now()}`,
            name: 'general',
            server_id: newServer.id,
            type: 'TEXT',
            created_at: new Date().toISOString(),
        };

        setServers((prev) => [...prev, newServer]);
        setServerMembers((prev) => [...prev, newMember]);
        setChannels((prev) => [...prev, generalChannel]);

        return newServer;
    };

    const createChannel = async (
        name: string,
        serverId: string,
    ): Promise<Channel> => {
        if (!currentUser) throw new Error('Not authenticated');

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const newChannel: Channel = {
            id: `channel-${Date.now()}`,
            name: name.toLowerCase().replace(/\s+/g, '-'),
            server_id: serverId,
            type: 'TEXT',
            created_at: new Date().toISOString(),
        };

        setChannels((prev) => [...prev, newChannel]);
        return newChannel;
    };

    const sendMessage = async (
        content: string,
        channelId: string,
    ): Promise<Message> => {
        if (!currentUser) throw new Error('Not authenticated');

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 200));

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            content,
            channel_id: channelId,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);
        return newMessage;
    };

    const getUserServers = (userId: string): Server[] => {
        const userServerIds = serverMembers
            .filter((m) => m.user_id === userId)
            .map((m) => m.server_id);
        return servers.filter((s) => userServerIds.includes(s.id));
    };

    const getServerChannels = (serverId: string): Channel[] => {
        return channels.filter((c) => c.server_id === serverId);
    };

    const getChannelMessages = (channelId: string): Message[] => {
        return messages.filter((m) => m.channel_id === channelId);
    };

    const isUserServerMember = (userId: string, serverId: string): boolean => {
        return serverMembers.some(
            (m) => m.user_id === userId && m.server_id === serverId,
        );
    };

    const isUserServerAdmin = (userId: string, serverId: string): boolean => {
        return serverMembers.some(
            (m) =>
                m.user_id === userId &&
                m.server_id === serverId &&
                m.role === 'ADMIN',
        );
    };

    // Add this function to the context value
    const value: MockDataContextType = {
        currentUser,
        users,
        servers,
        channels,
        messages,
        serverMembers,
        login,
        register,
        logout: federatedLogout,
        createServer,
        createChannel,
        sendMessage,
        getUserServers,
        getServerChannels,
        getChannelMessages,
        isUserServerMember,
        isUserServerAdmin,
        getServerMembers, // Add this new function
    };

    return (
        <MockDataContext.Provider value={value}>
            {children}
        </MockDataContext.Provider>
    );
}

export const useMockData = () => {
    const context = useContext(MockDataContext);
    if (context === undefined) {
        throw new Error('useMockData must be used inside MockDataProvider');
    }
    return context;
};
