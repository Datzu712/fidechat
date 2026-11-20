import type {
    ChannelWithMessages,
    GuildWithMembers,
    Message,
    SyncPayload,
} from '@fidechat/shared';
import { describe, expect, it } from 'vitest';

import {
    addChannel,
    addGuild,
    addMember,
    addMessage,
    removeMessage,
    setConnectedUsers,
    updateMessage,
} from '@/features/sync/lib/sync-updaters';

const me = {
    id: 'u1',
    username: 'me',
    email: 'me@example.com',
    isBot: false,
    avatarUrl: null,
};

function message(id: string, channelId = 'c1'): Message {
    return {
        id,
        channelId,
        authorId: 'u1',
        content: `message ${id}`,
        createdAt: '2026-01-01T00:00:00.000Z',
    };
}

function channel(id: string, messages: Message[] = []): ChannelWithMessages {
    return {
        id,
        guildId: 'g1',
        name: id,
        description: null,
        position: 0,
        messages,
    } as ChannelWithMessages;
}

function guild(id: string, memberIds: string[] = []): GuildWithMembers {
    return {
        id,
        name: id,
        ownerId: 'u1',
        members: memberIds.map((userId) => ({ userId })),
    } as GuildWithMembers;
}

function state(overrides: Partial<SyncPayload> = {}): SyncPayload {
    return {
        currentUser: me,
        users: [me],
        guilds: [guild('g1', ['u1'])],
        channels: [channel('c1', [message('m1')]), channel('c2')],
        connectedUsers: [],
        ...overrides,
    };
}

describe('addGuild', () => {
    it('appends a new guild', () => {
        const next = addGuild(state(), guild('g2'));
        expect(next.guilds.map((g) => g.id)).toEqual(['g1', 'g2']);
    });

    it('ignores a guild it already has', () => {
        const data = state();
        expect(addGuild(data, guild('g1'))).toBe(data);
    });
});

describe('addChannel', () => {
    it('appends the channel with no messages', () => {
        const { messages: _, ...plain } = channel('c3');
        const next = addChannel(state(), plain);
        expect(next.channels.at(-1)).toEqual(channel('c3'));
    });

    it('ignores a channel it already has', () => {
        const data = state();
        expect(addChannel(data, channel('c1'))).toBe(data);
    });
});

describe('addMember', () => {
    const user = { id: 'u2', username: 'two', isBot: false, avatarUrl: null };

    it('adds the user and the guild membership', () => {
        const next = addMember(state(), {
            user,
            memberMetadata: { guildId: 'g1', userId: 'u2' },
        } as Parameters<typeof addMember>[1]);
        expect(next.users.map((u) => u.id)).toEqual(['u1', 'u2']);
        expect(next.guilds[0].members).toEqual([
            { userId: 'u1' },
            { userId: 'u2' },
        ]);
    });

    it('does not duplicate a known user or member', () => {
        const data = state({ users: [me, user] });
        const payload = {
            user,
            memberMetadata: { guildId: 'g1', userId: 'u1' },
        } as Parameters<typeof addMember>[1];
        const next = addMember(data, payload);
        expect(next.users).toHaveLength(2);
        expect(next.guilds[0].members).toHaveLength(1);
    });
});

describe('addMessage', () => {
    it('appends the message to its channel only', () => {
        const next = addMessage(state(), message('m2'));
        expect(next.channels[0].messages.map((m) => m.id)).toEqual([
            'm1',
            'm2',
        ]);
        expect(next.channels[1].messages).toEqual([]);
    });

    it('ignores a duplicate message (socket echo after a refetch)', () => {
        const next = addMessage(state(), message('m1'));
        expect(next.channels[0].messages).toHaveLength(1);
    });

    it('returns the same state for an unknown channel', () => {
        const data = state();
        expect(addMessage(data, message('m2', 'nope'))).toBe(data);
    });
});

describe('updateMessage', () => {
    it('changes the content and keeps the other channels', () => {
        const data = state();
        const next = updateMessage(data, { id: 'm1', content: 'edited' });
        expect(next.channels[0].messages[0].content).toBe('edited');
        expect(next.channels[1]).toBe(data.channels[1]);
        // The previous state is not mutated.
        expect(data.channels[0].messages[0].content).toBe('message m1');
    });

    it('returns the same state for an unknown message', () => {
        const data = state();
        expect(updateMessage(data, { id: 'nope', content: 'x' })).toBe(data);
    });
});

describe('removeMessage', () => {
    it('removes the message', () => {
        const next = removeMessage(state(), { id: 'm1', channelId: 'c1' });
        expect(next.channels[0].messages).toEqual([]);
    });

    it('returns the same state for an unknown channel', () => {
        const data = state();
        expect(removeMessage(data, { id: 'm1', channelId: 'nope' })).toBe(data);
    });
});

describe('setConnectedUsers', () => {
    it('replaces the presence list', () => {
        const users = [
            { userId: 'u1', status: 'dnd', isTyping: false },
        ] as SyncPayload['connectedUsers'];
        expect(setConnectedUsers(state(), users).connectedUsers).toBe(users);
    });
});
