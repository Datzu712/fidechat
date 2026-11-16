import { detectBot } from '@/modules/ai/bots.js';

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
