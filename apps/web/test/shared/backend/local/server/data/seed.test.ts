import { BOT_DEFINITIONS } from '@fidechat/shared';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BOT_SETTINGS } from '@/shared/backend/local/protocol';
import {
    createSeed,
    ensureBots,
} from '@/shared/backend/local/server/data/seed';
import {
    type LocalState,
    STATE_VERSION,
} from '@/shared/backend/local/server/data/state';

describe('createSeed', () => {
    const seed = createSeed(new Date('2026-01-01T00:00:00Z'));

    it('has the current version and a public default guild', () => {
        expect(seed.version).toBe(STATE_VERSION);
        expect(
            seed.guilds.find((g) => g.id === seed.defaultGuildId)?.isPublic,
        ).toBe(true);
    });

    it('has five or six human users, all members of the default guild', () => {
        const humans = seed.users.filter((u) => !u.isBot);
        expect(humans.length).toBeGreaterThanOrEqual(5);
        expect(humans.length).toBeLessThanOrEqual(6);
        for (const user of humans)
            expect(seed.members).toContainEqual({
                guildId: seed.defaultGuildId,
                userId: user.id,
            });
    });

    it('has two or three channels and a welcome message that mentions opening another tab', () => {
        expect([2, 3]).toContain(seed.channels.length);
        expect(seed.messages.some((m) => /another tab/i.test(m.content))).toBe(
            true,
        );
    });

    it('has the default bot settings', () => {
        expect(seed.botSettings).toEqual(DEFAULT_BOT_SETTINGS);
        expect(DEFAULT_BOT_SETTINGS).toEqual({
            temperature: 0.3,
            maxNewTokens: 120,
            historyLimit: 10,
            disabledBotIds: [],
        });
    });

    it('uses unique UUID ids', () => {
        const ids = [
            ...seed.users,
            ...seed.guilds,
            ...seed.channels,
            ...seed.messages,
        ].map((x) => x.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids)
            expect(id).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
            );
    });
});

describe('ensureBots', () => {
    const seed = createSeed(new Date('2026-01-01T00:00:00Z'));

    it('adds the three bots as users and default-guild members to a snapshot without them, and is idempotent', () => {
        const withBots = ensureBots(seed);

        for (const { user } of BOT_DEFINITIONS) {
            expect(withBots.users).toContainEqual(user);
            expect(withBots.members).toContainEqual({
                guildId: seed.defaultGuildId,
                userId: user.id,
            });
        }
        expect(withBots.users).toHaveLength(
            seed.users.length + BOT_DEFINITIONS.length,
        );
        expect(withBots.members).toHaveLength(
            seed.members.length + BOT_DEFINITIONS.length,
        );
        expect(ensureBots(withBots)).toBe(withBots);
    });

    it('gives a snapshot without bot settings the defaults, and keeps stored ones', () => {
        const { botSettings: _, ...withoutSettings } = ensureBots(seed);
        const loaded = ensureBots(withoutSettings as LocalState);
        expect(loaded.botSettings).toEqual(DEFAULT_BOT_SETTINGS);
        expect(ensureBots(loaded)).toBe(loaded);

        const tuned = {
            ...loaded,
            botSettings: { ...DEFAULT_BOT_SETTINGS, historyLimit: 5 },
        };
        expect(ensureBots(tuned)).toBe(tuned);
    });
});
