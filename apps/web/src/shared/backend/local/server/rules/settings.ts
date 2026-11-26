import { BOT_DEFINITIONS } from '@fidechat/shared';
import * as z from 'zod/mini';

import {
    BOT_SETTING_LIMITS,
    type BotSettings,
} from '@/shared/backend/local/protocol';
import type { LocalState } from '@/shared/backend/local/server/data/state';
import {
    type Request,
    RuleError,
    type RuleOutcome,
} from '@/shared/backend/local/server/rules/helpers';

export function updateBotSettings({
    state,
    request,
}: {
    state: LocalState;
    request: Request<'updateBotSettings'>;
}): RuleOutcome {
    // Any signed-in user may tune the bots: the demo has no roles.
    const botSettings = validBotSettings({
        current: state.botSettings,
        settings: request.settings,
    });
    return {
        state: { ...state, botSettings },
        events: [],
        result: botSettings,
    };
}

/** A setting from `BOT_SETTING_LIMITS`; absent keeps the current value. */
function limitedNumber({
    key,
    label,
    integer,
}: {
    key: keyof typeof BOT_SETTING_LIMITS;
    label: string;
    integer: boolean;
}) {
    const { min, max } = BOT_SETTING_LIMITS[key];
    const error = `${label} must be ${integer ? 'an integer' : 'a number'} from ${min} to ${max}`;
    const type = integer ? z.int({ error }) : z.number({ error });
    return z.optional(type.check(z.gte(min, { error }), z.lte(max, { error })));
}

const botIds: string[] = BOT_DEFINITIONS.map(({ user }) => user.id);
const botsError = 'Disabled bots must be a list of bot ids';

// The keys are checked in this order.
const settingsSchema = z.strictObject(
    {
        temperature: limitedNumber({
            key: 'temperature',
            label: 'Temperature',
            integer: false,
        }),
        maxNewTokens: limitedNumber({
            key: 'maxNewTokens',
            label: 'Max new tokens',
            integer: true,
        }),
        historyLimit: limitedNumber({
            key: 'historyLimit',
            label: 'History limit',
            integer: true,
        }),
        disabledBotIds: z.optional(
            z.array(
                z.string({ error: botsError }).check(
                    z.refine((id) => botIds.includes(id), {
                        error: botsError,
                    }),
                ),
                { error: botsError },
            ),
        ),
    },
    {
        error: (issue) =>
            issue.code === 'unrecognized_keys'
                ? `Unknown setting: ${issue.keys[0]}`
                : 'Settings must be an object',
    },
);

/** `current` with the given fields, each validated; an absent field is kept. */
function validBotSettings({
    current,
    settings,
}: {
    current: BotSettings;
    settings: unknown;
}): BotSettings {
    const result = settingsSchema.safeParse(settings);
    if (!result.success) {
        // zod reports unknown keys last; they win, as before.
        const { issues } = result.error;
        const issue =
            issues.find((i) => i.code === 'unrecognized_keys') ?? issues[0];
        throw new RuleError(400, issue.message);
    }
    const { temperature, maxNewTokens, historyLimit, disabledBotIds } =
        result.data;

    return {
        temperature: temperature ?? current.temperature,
        maxNewTokens: maxNewTokens ?? current.maxNewTokens,
        historyLimit: historyLimit ?? current.historyLimit,
        disabledBotIds:
            disabledBotIds === undefined
                ? current.disabledBotIds
                : [...new Set(disabledBotIds)],
    };
}
