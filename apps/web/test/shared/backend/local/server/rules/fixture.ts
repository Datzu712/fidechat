import type { AppUser, ConnectedUser } from '@fidechat/shared';
import { expect } from 'vitest';

import type { LocalRequest } from '@/shared/backend/local/protocol';
import {
    createSeed,
    SEED_GUILD_ID,
} from '@/shared/backend/local/server/data/seed';
import type { LocalState } from '@/shared/backend/local/server/data/state';
import {
    type RuleContext,
    RuleError,
} from '@/shared/backend/local/server/rules/helpers';
import { applyRequest } from '@/shared/backend/local/server/rules/rules';

export const NOW = new Date('2026-11-20T12:00:00.000Z');
export const LATER = new Date('2026-11-20T13:00:00.000Z');

export const seed = createSeed(NOW);
export const [alice, bruno, carmen] = seed.users;
export const GENERAL_ID = seed.channels[0].id;
export const RANDOM_ID = seed.channels[1].id;
export const WELCOME_ID = seed.messages[0].id;

export const OTHER_GUILD_ID = 'g-other';
export const OTHER_CHANNEL_ID = 'c-other';
export const OTHER_MESSAGE_ID = 'm-other';
export const BOT: AppUser = {
    id: 'bot-1',
    username: 'robot',
    email: 'robot@demo.local',
    isBot: true,
    avatarUrl: null,
};

/** The seed plus a second, private guild owned by bruno, and a bot in the seed guild. */
export function fixture(): LocalState {
    return {
        ...seed,
        users: [...seed.users, BOT],
        guilds: [
            ...seed.guilds,
            {
                id: OTHER_GUILD_ID,
                name: 'Bruno place',
                iconUrl: null,
                isPublic: false,
                ownerId: bruno.id,
                description: null,
            },
        ],
        members: [
            ...seed.members,
            { guildId: SEED_GUILD_ID, userId: BOT.id },
            { guildId: OTHER_GUILD_ID, userId: bruno.id },
        ],
        channels: [
            ...seed.channels,
            {
                id: OTHER_CHANNEL_ID,
                name: 'secret',
                description: null,
                position: 0,
                guildId: OTHER_GUILD_ID,
            },
        ],
        messages: [
            ...seed.messages,
            {
                id: OTHER_MESSAGE_ID,
                content: 'hidden',
                authorId: bruno.id,
                channelId: OTHER_CHANNEL_ID,
                createdAt: NOW.toISOString(),
            },
        ],
    };
}

export const connectedUsers: ConnectedUser[] = [
    { userId: alice.id, status: 'online', isTyping: false },
];

export function context(): RuleContext {
    let next = 0;
    return {
        newId: () => `new-${++next}`,
        now: () => LATER,
        connectedUsers,
    };
}

export function run(userId: string | null, request: LocalRequest) {
    const state = fixture();
    const copy = structuredClone(state);
    const outcome = applyRequest({
        state,
        userId,
        request,
        context: context(),
    });
    expect(state).toEqual(copy);
    return outcome;
}

export function rejects(
    userId: string | null,
    request: LocalRequest,
    status: number,
    message: string,
) {
    const state = fixture();
    const copy = structuredClone(state);
    let error: unknown;
    try {
        applyRequest({ state, userId, request, context: context() });
    } catch (caught) {
        error = caught;
    }
    expect(error).toBeInstanceOf(RuleError);
    expect(error).toMatchObject({ status, message });
    expect(state).toEqual(copy);
}

export const seedMemberIds = [...seed.users.map((user) => user.id), BOT.id];
