import { BOT_DEFINITIONS } from '@fidechat/shared';
import { describe, expect, it } from 'vitest';

import {
    buildBotMessages,
    cleanBotReply,
    SHORT_STYLE,
    type HistoryEntry,
} from '@/shared/backend/local/server/bots/bot-prompt';

function h(
    authorId: string,
    authorName: string,
    content: string,
): HistoryEntry {
    return { authorId, authorName, content };
}

const [, chayanne, pedro] = BOT_DEFINITIONS;

describe('buildBotMessages', () => {
    it('starts with the persona plus the short style', () =>
        expect(
            buildBotMessages({
                bot: chayanne,
                history: [h('u1', 'ana', 'hola')],
                historyLimit: 10,
            })[0],
        ).toEqual({
            role: 'system',
            content: chayanne.persona + SHORT_STYLE,
        }));

    it("turns the bot's own messages into assistant turns and the rest into 'name: text'", () =>
        expect(
            buildBotMessages({
                bot: chayanne,
                history: [
                    h('u1', 'ana', 'hola'),
                    h(chayanne.user.id, 'chayanne', '¡wepa!'),
                    h(pedro.user.id, 'pedro_pascal', 'buenas'),
                ],
                historyLimit: 10,
            }).slice(1),
        ).toEqual([
            { role: 'user', content: 'ana: hola' },
            { role: 'assistant', content: '¡wepa!' },
            { role: 'user', content: 'pedro_pascal: buenas' },
        ]));

    it('keeps only the last historyLimit messages and drops leading assistant turns', () => {
        // 12 entries: the bot wrote entry 2 (the first one inside the last-10
        // window), ana wrote the rest.
        const history = Array.from({ length: 12 }, (_, i) =>
            i === 2
                ? h(chayanne.user.id, 'chayanne', 'm2')
                : h('u1', 'ana', `m${i}`),
        );
        const turns = buildBotMessages({
            bot: chayanne,
            history,
            historyLimit: 10,
        }).slice(1);
        expect(turns).toHaveLength(9);
        expect(turns[0]).toEqual({ role: 'user', content: 'ana: m3' });

        const short = buildBotMessages({
            bot: chayanne,
            history,
            historyLimit: 3,
        }).slice(1);
        expect(short.map((turn) => turn.content)).toEqual([
            'ana: m9',
            'ana: m10',
            'ana: m11',
        ]);
    });
});

describe('cleanBotReply', () => {
    const usernames = ['ana', 'chayanne', 'pedro_pascal', 'Chat yipiyi'];

    it.each([
        [
            'Chayanne: ¡Me recomendaría "La Vida Es Un Sueño"!',
            '¡Me recomendaría "La Vida Es Un Sueño"!',
        ],
        // Matches the bot's trigger.
        ['Pedro: ¡Qué emocionante!', '¡Qué emocionante!'],
        [
            'ana: chayanne, ¡me recomendaría "Despacito"!',
            'chayanne, ¡me recomendaría "Despacito"!',
        ],
        // Repeated prefix.
        ['chayanne: Chayanne: hola', 'hola'],
        // Not a user, stays.
        ['Nota: llevá abrigo.', 'Nota: llevá abrigo.'],
        ['   ', ''],
        // Mentions a bot but is not a speaker label.
        ['Como dice Pedro: hola', 'Como dice Pedro: hola'],
        // Only a prefix.
        ['chayanne:', ''],
    ])('cleans %j', (text, expected) =>
        expect(cleanBotReply({ text, truncated: false, usernames })).toBe(
            expected,
        ),
    );

    it('cuts a truncated reply back to its last finished sentence', () =>
        expect(
            cleanBotReply({
                text: 'Let es variable. Const no cambia. Se utiliza',
                truncated: true,
                usernames,
            }),
        ).toBe('Let es variable. Const no cambia.'));

    it('strips a known username that contains punctuation', () =>
        expect(
            cleanBotReply({
                text: 'juan.perez: hola',
                truncated: false,
                usernames: [...usernames, 'juan.perez'],
            }),
        ).toBe('hola'));

    it('strips the prefix before cutting a truncated reply', () =>
        expect(
            cleanBotReply({
                text: 'chayanne: Hola amigo. Se utiliza',
                truncated: true,
                usernames,
            }),
        ).toBe('Hola amigo.'));

    it('returns empty when a truncated reply has no finished sentence', () =>
        expect(
            cleanBotReply({
                text: 'Se utiliza para',
                truncated: true,
                usernames,
            }),
        ).toBe(''));
});
