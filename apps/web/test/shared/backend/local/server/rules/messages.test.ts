import { describe, expect, it } from 'vitest';

import type { LocalRequest } from '@/shared/backend/local/protocol';
import { SEED_GUILD_ID } from '@/shared/backend/local/server/data/seed';

import {
    alice,
    bruno,
    GENERAL_ID,
    LATER,
    OTHER_CHANNEL_ID,
    OTHER_GUILD_ID,
    RANDOM_ID,
    rejects,
    run,
    seedMemberIds,
    WELCOME_ID,
} from './fixture';

const message = (content: unknown) => ({ content }) as { content: string };

describe('applyRequest authorization', () => {
    it('rejects createMessage by a non-member', () => {
        rejects(
            alice.id,
            {
                op: 'createMessage',
                guildId: OTHER_GUILD_ID,
                channelId: OTHER_CHANNEL_ID,
                payload: { content: 'hi' },
            },
            403,
            'Not a member of this guild',
        );
    });

    it('rejects createMessage with a channel of another guild', () => {
        rejects(
            bruno.id,
            {
                op: 'createMessage',
                guildId: OTHER_GUILD_ID,
                channelId: GENERAL_ID,
                payload: { content: 'hi' },
            },
            404,
            'Channel not found',
        );
    });

    it('rejects updateMessage by another user', () => {
        rejects(
            bruno.id,
            {
                op: 'updateMessage',
                guildId: SEED_GUILD_ID,
                channelId: GENERAL_ID,
                messageId: WELCOME_ID,
                payload: { content: 'edited' },
            },
            403,
            'Only the author can change this message',
        );
    });

    it('rejects deleteMessage by another user', () => {
        rejects(
            bruno.id,
            {
                op: 'deleteMessage',
                guildId: SEED_GUILD_ID,
                channelId: GENERAL_ID,
                messageId: WELCOME_ID,
            },
            403,
            'Only the author can change this message',
        );
    });

    it('rejects updateMessage with the wrong channel in the route', () => {
        rejects(
            alice.id,
            {
                op: 'updateMessage',
                guildId: SEED_GUILD_ID,
                channelId: RANDOM_ID,
                messageId: WELCOME_ID,
                payload: { content: 'edited' },
            },
            404,
            'Message not found',
        );
    });

    it('rejects updateMessage with the wrong guild in the route', () => {
        rejects(
            alice.id,
            {
                op: 'updateMessage',
                guildId: OTHER_GUILD_ID,
                channelId: GENERAL_ID,
                messageId: WELCOME_ID,
                payload: { content: 'edited' },
            },
            404,
            'Message not found',
        );
    });

    it('rejects deleteMessage with the wrong channel in the route', () => {
        rejects(
            alice.id,
            {
                op: 'deleteMessage',
                guildId: SEED_GUILD_ID,
                channelId: RANDOM_ID,
                messageId: WELCOME_ID,
            },
            404,
            'Message not found',
        );
    });

    it('rejects deleteMessage with the wrong guild in the route', () => {
        rejects(
            alice.id,
            {
                op: 'deleteMessage',
                guildId: OTHER_GUILD_ID,
                channelId: GENERAL_ID,
                messageId: WELCOME_ID,
            },
            404,
            'Message not found',
        );
    });
});

describe('applyRequest validation', () => {
    const tooLong = 'a'.repeat(2001);
    const contentError =
        'Message content must be a string of at most 2000 characters';
    const create = (content: unknown): LocalRequest => ({
        op: 'createMessage',
        guildId: SEED_GUILD_ID,
        channelId: GENERAL_ID,
        payload: message(content),
    });
    const update = (content: unknown): LocalRequest => ({
        op: 'updateMessage',
        guildId: SEED_GUILD_ID,
        channelId: GENERAL_ID,
        messageId: WELCOME_ID,
        payload: message(content),
    });

    it('rejects message content of 2001 characters', () => {
        rejects(alice.id, create(tooLong), 400, contentError);
        rejects(alice.id, update(tooLong), 400, contentError);
    });

    it('rejects message content that is not a string', () => {
        rejects(alice.id, create(42), 400, contentError);
        rejects(alice.id, update(undefined), 400, contentError);
    });

    it('stores message content of 2000 characters', () => {
        const content = 'a'.repeat(2000);
        const created = run(alice.id, create(content));
        expect(created.state.messages.at(-1)?.content).toBe(content);
        const updated = run(alice.id, update(content));
        expect(
            updated.state.messages.find((m) => m.id === WELCOME_ID)?.content,
        ).toBe(content);
    });

    it('rejects updateMessage without a user before checking the content', () => {
        rejects(
            null,
            {
                op: 'updateMessage',
                guildId: SEED_GUILD_ID,
                channelId: GENERAL_ID,
                messageId: WELCOME_ID,
                payload: message(42),
            },
            401,
            'Not signed in',
        );
    });
});

describe('applyRequest results and events', () => {
    it('createMessage stores the message and tells the guild members', () => {
        const outcome = run(alice.id, {
            op: 'createMessage',
            guildId: SEED_GUILD_ID,
            channelId: GENERAL_ID,
            payload: { content: 'hello' },
        });
        const created = {
            id: 'new-1',
            content: 'hello',
            authorId: alice.id,
            channelId: GENERAL_ID,
            createdAt: LATER.toISOString(),
        };
        expect(outcome.result).toEqual({ id: 'new-1' });
        expect(outcome.state.messages.at(-1)).toEqual(created);
        expect(outcome.events).toEqual([
            { to: seedMemberIds, event: 'messageCreate', payload: created },
        ]);
    });

    it('updateMessage changes the content and tells the guild members', () => {
        const outcome = run(alice.id, {
            op: 'updateMessage',
            guildId: SEED_GUILD_ID,
            channelId: GENERAL_ID,
            messageId: WELCOME_ID,
            payload: { content: 'edited' },
        });
        expect(
            outcome.state.messages.find((m) => m.id === WELCOME_ID)?.content,
        ).toBe('edited');
        expect(outcome.events).toEqual([
            {
                to: seedMemberIds,
                event: 'messageUpdate',
                payload: { id: WELCOME_ID, content: 'edited' },
            },
        ]);
    });

    it('deleteMessage removes the message and tells the guild members', () => {
        const outcome = run(alice.id, {
            op: 'deleteMessage',
            guildId: SEED_GUILD_ID,
            channelId: GENERAL_ID,
            messageId: WELCOME_ID,
        });
        expect(outcome.state.messages.some((m) => m.id === WELCOME_ID)).toBe(
            false,
        );
        expect(outcome.events).toEqual([
            {
                to: seedMemberIds,
                event: 'messageDelete',
                payload: { id: WELCOME_ID, channelId: GENERAL_ID },
            },
        ]);
    });
});
