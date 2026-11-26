import { describe, expect, it } from 'vitest';

import type { LocalRequest } from '@/shared/backend/local/protocol';
import { SEED_GUILD_ID } from '@/shared/backend/local/server/data/seed';

import { alice, GENERAL_ID, rejects, run, WELCOME_ID } from './fixture';

describe('applyRequest authorization', () => {
    const signedInOps: LocalRequest[] = [
        { op: 'sync' },
        { op: 'getPublicGuilds' },
        { op: 'createGuild', payload: { name: 'x' } },
        { op: 'createChannel', guildId: SEED_GUILD_ID, payload: { name: 'x' } },
        {
            op: 'createMessage',
            guildId: SEED_GUILD_ID,
            channelId: GENERAL_ID,
            payload: { content: 'x' },
        },
        {
            op: 'updateMessage',
            guildId: SEED_GUILD_ID,
            channelId: GENERAL_ID,
            messageId: WELCOME_ID,
            payload: { content: 'x' },
        },
        {
            op: 'deleteMessage',
            guildId: SEED_GUILD_ID,
            channelId: GENERAL_ID,
            messageId: WELCOME_ID,
        },
        { op: 'getBotSettings' },
        { op: 'updateBotSettings', settings: { temperature: 1 } },
    ];

    for (const request of signedInOps) {
        it(`rejects ${request.op} without a user`, () => {
            rejects(null, request, 401, 'Not signed in');
        });
    }
});

describe('applyRequest validation', () => {
    const guild = (payload: object): LocalRequest => ({
        op: 'createGuild',
        payload: { name: 'g', ...payload },
    });
    const channel = (payload: object): LocalRequest => ({
        op: 'createChannel',
        guildId: SEED_GUILD_ID,
        payload: { name: 'c', ...payload },
    });

    it('treats null optional fields as absent, like the api', () => {
        const created = run(
            alice.id,
            guild({ iconUrl: null, isPublic: null }),
        ).state.guilds.at(-1);
        expect(created).toMatchObject({ iconUrl: null, isPublic: false });
        const made = run(
            alice.id,
            channel({ description: null, position: null }),
        ).state.channels.at(-1);
        expect(made).toMatchObject({ description: null, position: 0 });
    });
});
