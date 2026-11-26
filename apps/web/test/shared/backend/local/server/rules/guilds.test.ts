import type { Guild } from '@fidechat/shared';
import { describe, expect, it } from 'vitest';

import type { LocalRequest } from '@/shared/backend/local/protocol';

import { alice, carmen, rejects, run, seed } from './fixture';

describe('applyRequest validation', () => {
    it('rejects createGuild with a blank name', () => {
        rejects(
            alice.id,
            { op: 'createGuild', payload: { name: '   ' } },
            400,
            'Name is required',
        );
    });

    const guild = (payload: object): LocalRequest => ({
        op: 'createGuild',
        payload: { name: 'g', ...payload },
    });

    it('rejects createGuild with an icon URL that is not a URL', () => {
        rejects(
            alice.id,
            guild({ iconUrl: 'foo' }),
            400,
            'Icon URL must be a valid URL',
        );
        rejects(
            alice.id,
            guild({ iconUrl: 'javascript:alert(1)' }),
            400,
            'Icon URL must be a valid URL',
        );
        const { state } = run(
            alice.id,
            guild({ iconUrl: 'example.com/a.png' }),
        );
        expect(state.guilds.at(-1)?.iconUrl).toBe('example.com/a.png');
    });

    it('rejects createGuild with an isPublic that is not a boolean', () => {
        rejects(
            alice.id,
            guild({ isPublic: 'yes' }),
            400,
            'isPublic must be a boolean',
        );
    });
});

describe('applyRequest results and events', () => {
    it('createGuild fills the defaults and tells only the creator', () => {
        const outcome = run(carmen.id, {
            op: 'createGuild',
            payload: { name: 'Carmen club' },
        });
        const created: Guild = {
            id: 'new-1',
            name: 'Carmen club',
            iconUrl: null,
            isPublic: false,
            ownerId: carmen.id,
            description: null,
        };
        expect(outcome.state.guilds.at(-1)).toEqual(created);
        expect(
            outcome.state.members.filter((m) => m.guildId === 'new-1'),
        ).toEqual([{ guildId: 'new-1', userId: carmen.id }]);
        expect(outcome.events).toEqual([
            {
                to: [carmen.id],
                event: 'guildCreate',
                payload: { ...created, members: [{ userId: carmen.id }] },
            },
        ]);
    });

    it('getPublicGuilds returns only the public guilds', () => {
        const outcome = run(alice.id, { op: 'getPublicGuilds' });
        expect(outcome.result).toEqual(seed.guilds);
        expect(outcome.events).toEqual([]);
    });
});
