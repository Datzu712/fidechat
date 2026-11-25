import { BOT_DEFINITIONS } from '@fidechat/shared';
import { describe, expect, it } from 'vitest';

import {
    DEFAULT_BOT_SETTINGS,
    type LocalRequest,
} from '@/shared/backend/local/protocol';

import { alice, rejects, run } from './fixture';

describe('applyRequest bot settings validation', () => {
    const update = (settings: Record<string, unknown>): LocalRequest => ({
        op: 'updateBotSettings',
        settings,
    });
    const [, chayanne] = BOT_DEFINITIONS;
    const temperatureError = 'Temperature must be a number from 0 to 1.5';
    const tokensError = 'Max new tokens must be an integer from 16 to 400';
    const historyError = 'History limit must be an integer from 1 to 30';
    const botsError = 'Disabled bots must be a list of bot ids';

    it.each([
        ['temperature', -0.1, temperatureError],
        ['temperature', 1.6, temperatureError],
        ['temperature', '1', temperatureError],
        ['temperature', Number.NaN, temperatureError],
        ['temperature', null, temperatureError],
        ['maxNewTokens', 15, tokensError],
        ['maxNewTokens', 401, tokensError],
        ['maxNewTokens', 100.5, tokensError],
        ['maxNewTokens', '100', tokensError],
        ['historyLimit', 0, historyError],
        ['historyLimit', 31, historyError],
        ['historyLimit', 2.5, historyError],
        ['disabledBotIds', 'nope', botsError],
        ['disabledBotIds', ['unknown-bot'], botsError],
        ['disabledBotIds', [chayanne.user.id, 3], botsError],
    ])('rejects %s = %j', (field, value, error) => {
        rejects(alice.id, update({ [field]: value }), 400, error);
    });

    it('rejects an unknown field', () => {
        rejects(alice.id, update({ topP: 0.9 }), 400, 'Unknown setting: topP');
    });

    it('rejects an inherited key', () => {
        rejects(
            alice.id,
            update({ toString: 1 }),
            400,
            'Unknown setting: toString',
        );
    });

    it('rejects an unknown field before an invalid value', () => {
        rejects(
            alice.id,
            update({ temperature: 9, topP: 0.9 }),
            400,
            'Unknown setting: topP',
        );
    });

    it('rejects settings that are not an object', () => {
        rejects(
            alice.id,
            {
                op: 'updateBotSettings',
                settings: null as unknown as Record<string, never>,
            },
            400,
            'Settings must be an object',
        );
    });

    it('rejects the whole update when one field is invalid', () => {
        rejects(
            alice.id,
            update({ temperature: 1, historyLimit: 0 }),
            400,
            historyError,
        );
    });

    it('accepts the range limits', () => {
        const low = run(
            alice.id,
            update({
                temperature: 0,
                maxNewTokens: 16,
                historyLimit: 1,
                disabledBotIds: [],
            }),
        );
        expect(low.result).toEqual({
            temperature: 0,
            maxNewTokens: 16,
            historyLimit: 1,
            disabledBotIds: [],
        });
        const high = run(
            alice.id,
            update({ temperature: 1.5, maxNewTokens: 400, historyLimit: 30 }),
        );
        expect(high.result).toMatchObject({
            temperature: 1.5,
            maxNewTokens: 400,
            historyLimit: 30,
        });
    });
});

describe('applyRequest results and events', () => {
    it('getBotSettings returns the stored settings', () => {
        const outcome = run(alice.id, { op: 'getBotSettings' });
        expect(outcome.result).toEqual(DEFAULT_BOT_SETTINGS);
        expect(outcome.events).toEqual([]);
    });

    it('updateBotSettings merges the given fields, stores them without duplicate bots and emits nothing', () => {
        const [, chayanne, pedro] = BOT_DEFINITIONS;
        const outcome = run(alice.id, {
            op: 'updateBotSettings',
            settings: {
                temperature: 0.9,
                disabledBotIds: [
                    pedro.user.id,
                    chayanne.user.id,
                    pedro.user.id,
                ],
            },
        });
        const expected = {
            ...DEFAULT_BOT_SETTINGS,
            temperature: 0.9,
            disabledBotIds: [pedro.user.id, chayanne.user.id],
        };
        expect(outcome.result).toEqual(expected);
        expect(outcome.state.botSettings).toEqual(expected);
        expect(outcome.events).toEqual([]);
    });
});
