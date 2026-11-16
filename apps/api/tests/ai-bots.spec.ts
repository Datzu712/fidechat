import { BOTS, detectBot } from '@/modules/ai/bots.js';
import { buildPromptMessages, cleanReply, MAX_MESSAGE_LENGTH } from '@/modules/ai/prompt.js';

describe('detectBot', () => {
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
        expect(detectBot(content)?.user.username).toBe(username);
    });

    it.each(['chat', 'vamos a chatear', 'pascalina', 'hola a todos'])('%s -> null', (content) => {
        expect(detectBot(content)).toBeNull();
    });

    it('picks the first bot in BOTS order when several are named', () => {
        expect(detectBot('pedro y chayanne')?.user.username).toBe('chayanne');
    });
});

describe('buildPromptMessages', () => {
    const chayanne = BOTS[1];

    it('maps own messages to assistant and the rest to prefixed user messages, in order', () => {
        const history = [
            { authorId: 'u1', authorName: 'juan', content: 'hola chayanne' },
            { authorId: chayanne.user.id, authorName: 'chayanne', content: '¡Hola mi amor!' },
            { authorId: BOTS[2].user.id, authorName: 'pedro_pascal', content: 'yo también' },
        ];

        expect(buildPromptMessages(chayanne, history)).toEqual([
            { role: 'user', content: 'juan: hola chayanne' },
            { role: 'assistant', content: '¡Hola mi amor!' },
            { role: 'user', content: 'pedro_pascal: yo también' },
        ]);
    });

    it('drops its own messages at the start and end, since Anthropic needs the prompt to start and end on a user turn', () => {
        const history = [
            { authorId: chayanne.user.id, authorName: 'chayanne', content: 'old reply' },
            { authorId: 'u1', authorName: 'juan', content: 'hola chayanne' },
            { authorId: chayanne.user.id, authorName: 'chayanne', content: 'racing reply' },
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
