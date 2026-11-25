import type { AppUser, SyncPayload } from '@fidechat/shared';
import { describe, expect, it } from 'vitest';

import type { UserList } from '@/shared/backend/local/protocol';
import { SEED_GUILD_ID } from '@/shared/backend/local/server/data/seed';
import { applyRequest } from '@/shared/backend/local/server/rules/rules';

import {
    alice,
    BOT,
    connectedUsers,
    context,
    fixture,
    GENERAL_ID,
    rejects,
    run,
    seed,
    seedMemberIds,
} from './fixture';

describe('applyRequest validation', () => {
    it('rejects createUser with a blank name', () => {
        rejects(
            null,
            { op: 'createUser', username: '  ' },
            400,
            'Name is required',
        );
    });

    it('rejects createUser with a name of 33 characters', () => {
        rejects(
            null,
            { op: 'createUser', username: 'a'.repeat(33) },
            400,
            'Name is too long',
        );
    });

    it('rejects createUser with a taken name, ignoring case and outer spaces', () => {
        rejects(
            null,
            { op: 'createUser', username: '  ALICE ' },
            400,
            'That name is taken',
        );
    });
});

describe('applyRequest results and events', () => {
    it('createUser adds the user to the default guild and tells its members', () => {
        const outcome = run(null, { op: 'createUser', username: '  Zoe Q ' });
        const user: AppUser = {
            id: 'new-1',
            username: 'Zoe Q',
            email: 'zoe-q@demo.local',
            isBot: false,
            avatarUrl: null,
        };
        expect(outcome.result).toEqual(user);
        expect(outcome.state.users.at(-1)).toEqual(user);
        const memberMetadata = { guildId: SEED_GUILD_ID, userId: 'new-1' };
        expect(outcome.state.members.at(-1)).toEqual(memberMetadata);
        const { email: _email, ...publicUser } = user;
        expect(outcome.events).toEqual([
            {
                to: [...seedMemberIds, 'new-1'],
                event: 'memberAdd',
                payload: { user: publicUser, memberMetadata },
            },
        ]);
    });

    it('listUsers returns the humans without emails and who is connected', () => {
        const outcome = run(null, { op: 'listUsers' });
        const expected: UserList = {
            users: seed.users.map(({ email: _email, ...user }) => user),
            connectedUsers,
        };
        expect(outcome.result).toEqual(expected);
    });

    it('me returns the identity of the user', () => {
        const outcome = run(alice.id, { op: 'me' });
        expect(outcome.result).toEqual({
            sub: alice.id,
            name: alice.username,
            username: alice.username,
            email: alice.email,
        });
    });

    it('me returns null for an unknown user', () => {
        expect(run('nobody', { op: 'me' }).result).toBeNull();
        expect(run(null, { op: 'me' }).result).toBeNull();
    });

    it('sync returns only the guilds of the user, sorted', () => {
        const state = fixture();
        // Out of order, to check the sorting.
        state.channels.reverse();
        state.messages.reverse();
        const outcome = applyRequest({
            state,
            userId: alice.id,
            request: { op: 'sync' },
            context: context(),
        });
        const sync = outcome.result as SyncPayload;
        expect(sync.guilds).toEqual([
            {
                ...seed.guilds[0],
                members: seedMemberIds.map((userId) => ({ userId })),
            },
        ]);
        expect(sync.channels.map((c) => c.id)).toEqual(
            seed.channels.map((c) => c.id),
        );
        expect(sync.channels[0].messages).toEqual(
            seed.messages.filter((m) => m.channelId === GENERAL_ID),
        );
        expect(sync.users).toEqual(
            [...seed.users.slice(1), BOT].map(
                ({ email: _email, ...user }) => user,
            ),
        );
        expect(sync.currentUser).toEqual(alice);
        expect(sync.connectedUsers).toEqual(connectedUsers);
    });

    it('sync rejects an unknown user', () => {
        rejects('nobody', { op: 'sync' }, 400, 'No sync data found for user');
    });
});
