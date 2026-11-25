import { describe, expect, it } from 'vitest';

import { Presence } from '@/shared/backend/local/server/rules/presence';

const ALICE = 'user-alice';
const BRUNO = 'user-bruno';
const CHANNEL_ID = '0b6f2c2e-4d1a-4f7e-9a3b-6c8d2e1f0a9b';

describe('Presence', () => {
    it('registers a user as online and not typing', () => {
        const presence = new Presence();

        expect(presence.register('tab-1', ALICE)).toBe(true);
        expect(presence.activeUsers).toEqual([
            { userId: ALICE, status: 'online', isTyping: false },
        ]);
        expect(presence.userOf('tab-1')).toBe(ALICE);
    });

    it('adds nobody for a tab without a user', () => {
        const presence = new Presence();

        expect(presence.register('tab-1', null)).toBe(false);
        expect(presence.activeUsers).toEqual([]);
        expect(presence.userOf('tab-1')).toBeNull();
    });

    it('keeps a user online while one of their tabs is registered', () => {
        const presence = new Presence();
        presence.register('tab-1', ALICE);

        expect(presence.register('tab-2', ALICE)).toBe(false);
        expect(presence.unregister('tab-1')).toBe(false);
        expect(presence.activeUsers).toHaveLength(1);

        expect(presence.unregister('tab-2')).toBe(true);
        expect(presence.activeUsers).toEqual([]);
        expect(presence.userOf('tab-2')).toBeNull();
    });

    it('returns false when unregistering an unknown tab', () => {
        expect(new Presence().unregister('tab-1')).toBe(false);
    });

    it('keeps an updated status when a second tab registers', () => {
        const presence = new Presence();
        presence.register('tab-1', ALICE);

        expect(presence.update('tab-1', { status: 'dnd' })).toBe(true);
        presence.register('tab-2', ALICE);

        expect(presence.activeUsers).toEqual([
            { userId: ALICE, status: 'dnd', isTyping: false },
        ]);
    });

    it('applies a valid typing update', () => {
        const presence = new Presence();
        presence.register('tab-1', ALICE);

        expect(
            presence.update('tab-1', {
                isTyping: true,
                typingInChannel: CHANNEL_ID,
            }),
        ).toBe(true);
        expect(presence.activeUsers).toEqual([
            {
                userId: ALICE,
                status: 'online',
                isTyping: true,
                typingInChannel: CHANNEL_ID,
            },
        ]);
    });

    it.each([
        ['an unknown status', { status: 'busy' }],
        ['a non-boolean isTyping', { isTyping: 'yes' }],
        [
            'a typingInChannel that is not a UUID',
            { typingInChannel: 'general' },
        ],
        ['an empty update', {}],
        ['null', null],
    ])('drops %s', (_, data) => {
        const presence = new Presence();
        presence.register('tab-1', ALICE);

        expect(presence.update('tab-1', data)).toBe(false);
        expect(presence.activeUsers).toEqual([
            { userId: ALICE, status: 'online', isTyping: false },
        ]);
    });

    it('ignores a field given as undefined and any unknown field', () => {
        const presence = new Presence();
        presence.register('tab-1', ALICE);

        expect(
            presence.update('tab-1', {
                status: 'dnd',
                isTyping: undefined,
                userId: BRUNO,
            }),
        ).toBe(true);
        expect(presence.activeUsers).toEqual([
            { userId: ALICE, status: 'dnd', isTyping: false },
        ]);
    });

    it('accepts a typingInChannel id of any version and case', () => {
        const presence = new Presence();
        presence.register('tab-1', ALICE);
        const id = 'AAAAAAAA-0000-0000-0000-000000000000';

        expect(
            presence.update('tab-1', { isTyping: true, typingInChannel: id }),
        ).toBe(true);
        expect(presence.activeUsers[0].typingInChannel).toBe(id);
    });

    it('reports no change for an update that changes nothing', () => {
        const presence = new Presence();
        presence.register('tab-1', ALICE);
        expect(presence.update('tab-1', { status: 'dnd' })).toBe(true);

        expect(presence.update('tab-1', { status: 'dnd' })).toBe(false);
        expect(presence.update('tab-1', { isTyping: false })).toBe(false);
        expect(presence.activeUsers).toEqual([
            { userId: ALICE, status: 'dnd', isTyping: false },
        ]);
    });

    it('drops an update from an unregistered tab', () => {
        const presence = new Presence();

        expect(presence.update('tab-1', { status: 'dnd' })).toBe(false);
        expect(presence.activeUsers).toEqual([]);
    });

    it('moves a known tab to another user', () => {
        const presence = new Presence();
        presence.register('tab-1', ALICE);

        expect(presence.register('tab-1', BRUNO)).toBe(true);
        expect(presence.userOf('tab-1')).toBe(BRUNO);
        expect(presence.activeUsers).toEqual([
            { userId: BRUNO, status: 'online', isTyping: false },
        ]);
    });

    it('keeps the old user online when a moved tab was not their only one', () => {
        const presence = new Presence();
        presence.register('tab-1', ALICE);
        presence.register('tab-2', ALICE);

        presence.register('tab-1', BRUNO);

        expect(presence.activeUsers.map(({ userId }) => userId)).toEqual([
            ALICE,
            BRUNO,
        ]);
    });

    it('clears every tab and user', () => {
        const presence = new Presence();
        presence.register('tab-1', ALICE);
        presence.register('tab-2', BRUNO);

        presence.clear();

        expect(presence.activeUsers).toEqual([]);
        expect(presence.userOf('tab-1')).toBeNull();
    });

    it('bots are always online, also after clear()', () => {
        const presence = new Presence();
        presence.setAlwaysOnline([BRUNO]);
        presence.register('tab-1', ALICE);
        presence.register('tab-2', BRUNO);
        expect(presence.unregister('tab-2')).toBe(false);

        presence.clear();

        expect(presence.activeUsers).toEqual([
            { userId: BRUNO, status: 'online', isTyping: false },
        ]);
    });

    it('sets a user typing in a channel and back, reporting changes', () => {
        const presence = new Presence();
        presence.setAlwaysOnline([BRUNO]);

        expect(
            presence.setTyping({
                userId: BRUNO,
                channelId: CHANNEL_ID,
                typing: true,
            }),
        ).toBe(true);
        expect(presence.activeUsers).toEqual([
            {
                userId: BRUNO,
                status: 'online',
                isTyping: true,
                typingInChannel: CHANNEL_ID,
            },
        ]);
        expect(
            presence.setTyping({
                userId: BRUNO,
                channelId: CHANNEL_ID,
                typing: true,
            }),
        ).toBe(false);

        expect(
            presence.setTyping({
                userId: BRUNO,
                channelId: CHANNEL_ID,
                typing: false,
            }),
        ).toBe(true);
        expect(presence.activeUsers).toEqual([
            { userId: BRUNO, status: 'online', isTyping: false },
        ]);
        expect(
            presence.setTyping({
                userId: ALICE,
                channelId: CHANNEL_ID,
                typing: true,
            }),
        ).toBe(false);
    });
});
