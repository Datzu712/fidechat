import {
    type AppUser,
    BOT_DEFINITIONS,
    type Channel,
    type Message,
} from '@fidechat/shared';

import {
    type BotSettings,
    DEFAULT_BOT_SETTINGS,
} from '@/shared/backend/local/protocol';
import {
    type LocalState,
    STATE_VERSION,
} from '@/shared/backend/local/server/data/state';

export const SEED_GUILD_ID = '5e1d0c4a-7b2f-4c3e-9a61-0d8f2b7c4e10';

const GENERAL_ID = '5e1d0c4a-7b2f-4c3e-9a61-0d8f2b7c4e21';
const RANDOM_ID = '5e1d0c4a-7b2f-4c3e-9a61-0d8f2b7c4e22';
const MUSIC_ID = '5e1d0c4a-7b2f-4c3e-9a61-0d8f2b7c4e23';

const USERS: Array<Pick<AppUser, 'id' | 'username'>> = [
    { id: '3f6a2b1c-8d4e-4f5a-9b6c-1a2b3c4d5e01', username: 'alice' },
    { id: '3f6a2b1c-8d4e-4f5a-9b6c-1a2b3c4d5e02', username: 'bruno' },
    { id: '3f6a2b1c-8d4e-4f5a-9b6c-1a2b3c4d5e03', username: 'carmen' },
    { id: '3f6a2b1c-8d4e-4f5a-9b6c-1a2b3c4d5e04', username: 'diego' },
    { id: '3f6a2b1c-8d4e-4f5a-9b6c-1a2b3c4d5e05', username: 'elena' },
    { id: '3f6a2b1c-8d4e-4f5a-9b6c-1a2b3c4d5e06', username: 'felix' },
];

const MESSAGES: Array<Pick<Message, 'id' | 'content' | 'channelId'>> = [
    {
        id: '7c2e9d4b-1a3f-4b5c-8d6e-2f3a4b5c6d01',
        channelId: GENERAL_ID,
        content:
            'Welcome to Fidechat! Everything here runs in your browser: there is no server.',
    },
    {
        id: '7c2e9d4b-1a3f-4b5c-8d6e-2f3a4b5c6d02',
        channelId: GENERAL_ID,
        content:
            'Each tab is a user. Open another tab, pick a different user and chat with yourself.',
    },
    {
        id: '7c2e9d4b-1a3f-4b5c-8d6e-2f3a4b5c6d03',
        channelId: GENERAL_ID,
        content: 'Messages, channels and servers are saved in this browser.',
    },
    {
        id: '7c2e9d4b-1a3f-4b5c-8d6e-2f3a4b5c6d05',
        channelId: GENERAL_ID,
        content:
            'Want the bots to talk? Download the model in the bar at the top, then mention a bot by name, e.g. "chayanne, what should I listen to?"',
    },
    {
        id: '7c2e9d4b-1a3f-4b5c-8d6e-2f3a4b5c6d04',
        channelId: RANDOM_ID,
        content: 'Anything goes in here.',
    },
];

/** The state a fresh browser starts with: a few users chatting in one public guild. */
export function createSeed(now: Date): LocalState {
    const owner = USERS[0];
    const channels: Channel[] = [
        {
            id: GENERAL_ID,
            name: 'general',
            description: 'Say hi to everyone.',
            position: 0,
            guildId: SEED_GUILD_ID,
        },
        {
            id: RANDOM_ID,
            name: 'random',
            description: null,
            position: 1,
            guildId: SEED_GUILD_ID,
        },
        {
            id: MUSIC_ID,
            name: 'music',
            description: 'Share what you are listening to.',
            position: 2,
            guildId: SEED_GUILD_ID,
        },
    ];

    return {
        version: STATE_VERSION,
        defaultGuildId: SEED_GUILD_ID,
        users: USERS.map(({ id, username }) => ({
            id,
            username,
            email: `${username}@demo.local`,
            isBot: false,
            avatarUrl: null,
        })),
        guilds: [
            {
                id: SEED_GUILD_ID,
                name: 'Fidechat Lounge',
                iconUrl: null,
                isPublic: true,
                ownerId: owner.id,
                description: 'The default guild every user joins.',
            },
        ],
        members: USERS.map(({ id }) => ({
            guildId: SEED_GUILD_ID,
            userId: id,
        })),
        channels,
        messages: MESSAGES.map((message, index) => ({
            ...message,
            authorId: owner.id,
            createdAt: new Date(now.getTime() + index * 1000).toISOString(),
        })),
        botSettings: DEFAULT_BOT_SETTINGS,
    };
}

/**
 * Adds the bot users, their default-guild membership and the default bot
 * settings when missing. Returns the same object when nothing changed.
 */
export function ensureBots(state: LocalState): LocalState {
    const users = BOT_DEFINITIONS.filter(
        ({ user }) => !state.users.some((u) => u.id === user.id),
    ).map(({ user }) => ({ ...user }));
    const members = BOT_DEFINITIONS.filter(
        ({ user }) =>
            !state.members.some(
                (m) =>
                    m.guildId === state.defaultGuildId && m.userId === user.id,
            ),
    ).map(({ user }) => ({ guildId: state.defaultGuildId, userId: user.id }));
    // A snapshot saved before the settings existed has none.
    const hasSettings =
        (state.botSettings as BotSettings | undefined) !== undefined;
    if (!users.length && !members.length && hasSettings) return state;

    return {
        ...state,
        users: [...state.users, ...users],
        members: [...state.members, ...members],
        botSettings: hasSettings ? state.botSettings : DEFAULT_BOT_SETTINGS,
    };
}
