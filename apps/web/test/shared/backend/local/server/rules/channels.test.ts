import { describe, expect, it } from 'vitest';

import type { LocalRequest } from '@/shared/backend/local/protocol';
import { SEED_GUILD_ID } from '@/shared/backend/local/server/data/seed';

import { alice, bruno, rejects, run, seedMemberIds } from './fixture';

describe('applyRequest authorization', () => {
    it('rejects createChannel by a member who is not the owner', () => {
        rejects(
            bruno.id,
            {
                op: 'createChannel',
                guildId: SEED_GUILD_ID,
                payload: { name: 'new' },
            },
            403,
            'Only the guild owner can create channels',
        );
    });

    it('rejects createChannel in an unknown guild', () => {
        rejects(
            alice.id,
            { op: 'createChannel', guildId: 'nope', payload: { name: 'new' } },
            404,
            'Guild not found',
        );
    });
});

describe('applyRequest validation', () => {
    it('rejects createChannel with a blank name', () => {
        rejects(
            alice.id,
            {
                op: 'createChannel',
                guildId: SEED_GUILD_ID,
                payload: { name: '' },
            },
            400,
            'Name is required',
        );
    });

    const channel = (payload: object): LocalRequest => ({
        op: 'createChannel',
        guildId: SEED_GUILD_ID,
        payload: { name: 'c', ...payload },
    });

    it('rejects createChannel with a description that is not a string', () => {
        rejects(
            alice.id,
            channel({ description: 5 }),
            400,
            'Description must be a string',
        );
    });

    it('rejects createChannel with a position that is not a number', () => {
        rejects(
            alice.id,
            channel({ position: '1' }),
            400,
            'Position must be a number',
        );
        rejects(
            alice.id,
            channel({ position: Number.NaN }),
            400,
            'Position must be a number',
        );
        rejects(
            alice.id,
            channel({ position: Number.POSITIVE_INFINITY }),
            400,
            'Position must be a number',
        );
    });
});

describe('applyRequest results and events', () => {
    it('createChannel fills the defaults and tells the guild members', () => {
        const outcome = run(alice.id, {
            op: 'createChannel',
            guildId: SEED_GUILD_ID,
            payload: { name: 'new' },
        });
        const created = {
            id: 'new-1',
            name: 'new',
            description: null,
            position: 0,
            guildId: SEED_GUILD_ID,
        };
        expect(outcome.state.channels.at(-1)).toEqual(created);
        expect(outcome.events).toEqual([
            { to: seedMemberIds, event: 'channelCreate', payload: created },
        ]);
    });
});
