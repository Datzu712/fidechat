import { createHash } from 'node:crypto';

import { MAX_MESSAGE_LENGTH } from '@fidechat/shared';

import { BOTS, detectNamedBots } from '@/modules/ai/bots.js';
import { buildPromptMessages, cleanReply, reactionInstructions, trimToLastSentence } from '@/modules/ai/prompt.js';
import { buildRouterPrompt, planSpeakers } from '@/modules/ai/router.js';
import { SpontaneousCaps } from '@/modules/ai/spontaneous-caps.js';

describe('buildPromptMessages', () => {
    const chayanne = BOTS[1];

    it('maps own messages to assistant and the rest to prefixed user messages, in order', () => {
        const history = [
            { id: 'm1', authorId: 'u1', authorName: 'juan', content: 'hola chayanne' },
            { id: 'm2', authorId: chayanne.user.id, authorName: 'chayanne', content: '¡Hola mi amor!' },
            { id: 'm3', authorId: BOTS[2].user.id, authorName: 'pedro_pascal', content: 'yo también' },
        ];

        expect(buildPromptMessages(chayanne, history)).toEqual([
            { role: 'user', content: 'juan: hola chayanne' },
            { role: 'assistant', content: '¡Hola mi amor!' },
            { role: 'user', content: 'pedro_pascal: yo también' },
        ]);
    });

    it('drops its own messages at the start and end, since Anthropic needs the prompt to start and end on a user turn', () => {
        const history = [
            { id: 'm4', authorId: chayanne.user.id, authorName: 'chayanne', content: 'old reply' },
            { id: 'm5', authorId: 'u1', authorName: 'juan', content: 'hola chayanne' },
            { id: 'm6', authorId: chayanne.user.id, authorName: 'chayanne', content: 'racing reply' },
        ];

        expect(buildPromptMessages(chayanne, history)).toEqual([{ role: 'user', content: 'juan: hola chayanne' }]);
    });
});

describe('cleanReply', () => {
    const chayanne = BOTS[1];

    it('strips its own name prefix and trims', () => {
        expect(cleanReply(chayanne, '  chayanne: hola ')).toBe('hola');
    });

    it('keeps other text intact', () => {
        expect(cleanReply(chayanne, 'juan: dijo algo')).toBe('juan: dijo algo');
    });

    it('truncates to 2000 chars', () => {
        expect(cleanReply(chayanne, 'a'.repeat(2500))).toHaveLength(MAX_MESSAGE_LENGTH);
    });

    it('returns empty for blank output', () => {
        expect(cleanReply(chayanne, '   ')).toBe('');
    });
});

describe('reactionInstructions', () => {
    it('names the bots being reacted to and asks not to answer the question again', () => {
        const text = reactionInstructions([BOTS[0], BOTS[2]]);
        expect(text).toContain('Chat yipiyi y pedro_pascal');
        expect(text).toContain('sin volver a contestar la pregunta');
    });
});

describe('trimToLastSentence', () => {
    it('drops the unfinished sentence', () =>
        expect(trimToLastSentence('Hola, mi amor. Te cuento que ayer fui')).toBe('Hola, mi amor.'));
    it('keeps the last complete sentence of several', () =>
        expect(trimToLastSentence('¡Qué bien! ¿Y tú? Yo estaba pensando en')).toBe('¡Qué bien! ¿Y tú?'));
    it('does not cut at a decimal point', () => expect(trimToLastSentence('Sale la versión 2.5 mañana')).toBe(''));
    it('returns empty when no sentence finished', () => expect(trimToLastSentence('sin ningún final')).toBe(''));
});

describe('BOTS', () => {
    it('keeps every system prompt byte for byte', () => {
        const digest = createHash('sha256')
            .update(BOTS.map((bot) => bot.systemPrompt).join('\n---\n'))
            .digest('hex');
        expect(digest).toBe('af9228d086b915c1bc23b406e5107d7d417efe125b8a377f9bc3abc20e05d374');
    });
});

describe('detectNamedBots', () => {
    it('returns every named bot in BOTS order', () =>
        expect(detectNamedBots('pedro y chayanne').map((b) => b.user.username)).toEqual(['chayanne', 'pedro_pascal']));
    it('returns all three when all are named', () => expect(detectNamedBots('gpt, chayanne y pedro')).toHaveLength(3));
    it('returns [] when none is named', () => expect(detectNamedBots('hola a todos')).toEqual([]));

    it.each([
        ['hola chatgpt', 'Chat yipiyi'],
        ['chat gpt ayuda', 'Chat yipiyi'],
        ['GPT?', 'Chat yipiyi'],
        ['yipiyi', 'Chat yipiyi'],
        ['Chayanne canta', 'chayanne'],
        ['chayane', 'chayanne'],
        ['Pedro Pascal hola', 'pedro_pascal'],
        ['pedro', 'pedro_pascal'],
        ['PASCAL', 'pedro_pascal'],
    ])('%s -> %s', (content, username) => {
        expect(detectNamedBots(content).map((b) => b.user.username)).toEqual([username]);
    });

    it.each(['chat', 'vamos a chatear', 'pascalina'])('%s -> []', (content) => {
        expect(detectNamedBots(content)).toEqual([]);
    });
});

describe('SpontaneousCaps', () => {
    const MIN = 60_000;
    it('allows the first spontaneous reply', () => expect(new SpontaneousCaps().canSpeak('c1', 'b1', 0)).toBe(true));
    it('blocks the same bot in the same channel for 10 minutes', () => {
        const caps = new SpontaneousCaps();
        caps.record('c1', 'b1', 0);
        expect(caps.canSpeak('c1', 'b1', 10 * MIN - 1)).toBe(false);
        expect(caps.canSpeak('c1', 'b1', 10 * MIN)).toBe(true);
    });
    it('tracks channels and bots independently', () => {
        const caps = new SpontaneousCaps();
        caps.record('c1', 'b1', 0);
        expect(caps.canSpeak('c2', 'b1', 1)).toBe(true);
        expect(caps.canSpeak('c1', 'b2', 1)).toBe(true);
    });
});

describe('buildRouterPrompt', () => {
    const h = (id: string, authorName: string, content: string) => ({ id, authorId: id, authorName, content });

    it('keeps the last 20 messages and marks the new ones', () => {
        const history = Array.from({ length: 25 }, (_, i) => h(`m${i}`, 'ana', `msg ${i}`));
        const lines = buildRouterPrompt(history, new Set(['m24'])).split('\n');
        expect(lines[0]).toBe('ana: msg 5');
        expect(lines.at(-1)).toBe('[NUEVO] ana: msg 24');
        expect(lines.join('\n')).not.toContain('Acaban de responder');
    });

    it('names the excluded bots when asking for a reaction', () =>
        expect(buildRouterPrompt([h('m1', 'ana', 'hola')], new Set(), [BOTS[1]])).toContain('chayanne'));

    it('invites a witty reaction to the replies, but none when nothing calls for it', () => {
        const prompt = buildRouterPrompt([h('m1', 'ana', 'hola')], new Set(), [BOTS[1]]);
        expect(prompt).toContain('algo con gracia que decir');
        expect(prompt).not.toContain('normalmente ninguno');
    });
});

describe('planSpeakers', () => {
    const [gpt, chayanne, pedro] = BOTS;
    const yes = () => true;

    it('falls back to named bots when the router failed', () =>
        expect(planSpeakers(null, [chayanne], yes)).toEqual([{ bot: chayanne, kind: 'addressed' }]));

    it('adds a named bot the router missed, after the router addressed ones', () =>
        expect(planSpeakers([{ bot: pedro, kind: 'addressed' }], [chayanne], yes)).toEqual([
            { bot: pedro, kind: 'addressed' },
            { bot: chayanne, kind: 'addressed' },
        ]));

    it('treats a named bot as addressed even if the router called it spontaneous', () =>
        expect(planSpeakers([{ bot: chayanne, kind: 'spontaneous' }], [chayanne], () => false)).toEqual([
            { bot: chayanne, kind: 'addressed' },
        ]));

    it('does not repeat a bot that both the router and the named list picked', () =>
        expect(planSpeakers([{ bot: chayanne, kind: 'addressed' }], [chayanne], yes)).toEqual([
            { bot: chayanne, kind: 'addressed' },
        ]));

    it('orders named bots the router called spontaneous by BOTS order', () =>
        expect(
            planSpeakers(
                [
                    { bot: pedro, kind: 'spontaneous' },
                    { bot: chayanne, kind: 'spontaneous' },
                ],
                [chayanne, pedro],
                yes,
            ),
        ).toEqual([
            { bot: chayanne, kind: 'addressed' },
            { bot: pedro, kind: 'addressed' },
        ]));

    it('orders named bots by BOTS order even if they arrive out of order', () =>
        expect(planSpeakers([], [pedro, chayanne], yes).map((speaker) => speaker.bot)).toEqual([chayanne, pedro]));

    it('drops spontaneous speakers over their cap', () =>
        expect(planSpeakers([{ bot: pedro, kind: 'spontaneous' }], [], () => false)).toEqual([]));

    it('keeps all three named bots', () => expect(planSpeakers([], [gpt, chayanne, pedro], yes)).toHaveLength(3));

    it('limits unnamed router picks to 2, dropping spontaneous first', () =>
        expect(
            planSpeakers(
                [
                    { bot: gpt, kind: 'spontaneous' },
                    { bot: chayanne, kind: 'addressed' },
                    { bot: pedro, kind: 'addressed' },
                ],
                [],
                yes,
            ),
        ).toEqual([
            { bot: chayanne, kind: 'addressed' },
            { bot: pedro, kind: 'addressed' },
        ]));

    it('drops a spontaneous pick when a named bot and an addressed pick fill the turn', () =>
        expect(
            planSpeakers(
                [
                    { bot: pedro, kind: 'addressed' },
                    { bot: gpt, kind: 'spontaneous' },
                ],
                [chayanne],
                yes,
            ),
        ).toEqual([
            { bot: pedro, kind: 'addressed' },
            { bot: chayanne, kind: 'addressed' },
        ]));

    it('never trims a named bot, dropping router picks instead', () => {
        const speakers = planSpeakers(
            [
                { bot: gpt, kind: 'addressed' },
                { bot: pedro, kind: 'addressed' },
            ],
            [chayanne],
            yes,
        );
        expect(speakers.map((speaker) => speaker.bot)).toContain(chayanne);
        expect(speakers).toHaveLength(2);
    });
});
