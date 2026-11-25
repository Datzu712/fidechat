import { BOT_DEFINITIONS, MAX_MESSAGE_LENGTH } from '@fidechat/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    ChatMessage,
    Generated,
} from '@/shared/backend/local/model/model-protocol';
import {
    type BotSettings,
    DEFAULT_BOT_SETTINGS,
} from '@/shared/backend/local/protocol';
import {
    type BotResponderDeps,
    createBotResponder,
} from '@/shared/backend/local/server/bots/bots';

const [, chayanne, pedro] = BOT_DEFINITIONS;
const CHANNEL_ID = '0b6f2c2e-4d1a-4f7e-9a3b-6c8d2e1f0a9b';

interface Call {
    messages: ChatMessage[];
    temperature: number;
    maxNewTokens: number;
    resolve(value: Generated | null): void;
    reject(error: unknown): void;
}

/** A responder whose `generate` calls the test resolves by hand. */
function setup() {
    const log: string[] = [];
    const calls: Call[] = [];
    const settings: BotSettings = { ...DEFAULT_BOT_SETTINGS };
    const deps: BotResponderDeps = {
        generate({ messages, temperature, maxNewTokens }) {
            const persona = messages[0].content;
            const bot = BOT_DEFINITIONS.find((b) =>
                persona.startsWith(b.persona),
            );
            log.push(`generate:${bot?.user.username}`);
            return new Promise((resolve, reject) => {
                calls.push({
                    messages,
                    temperature,
                    maxNewTokens,
                    resolve,
                    reject,
                });
            });
        },
        history: () => [{ authorId: 'u1', authorName: 'ana', content: 'hi' }],
        usernames: () => [
            'ana',
            ...BOT_DEFINITIONS.map((b) => b.user.username),
        ],
        post: vi.fn(async ({ botId, content }) => {
            log.push(`post:${botId}:${content}`);
        }),
        setTyping({ botId, typing }) {
            log.push(`typing:${botId}:${typing}`);
        },
        settings: () => settings,
    };
    const responder = createBotResponder(deps);
    return { log, calls, deps, settings, responder };
}

/** Lets pending promise callbacks run. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
    vi.restoreAllMocks();
});

describe('createBotResponder', () => {
    it('only named bots answer', async () => {
        const { log, responder } = setup();

        responder.onHumanMessage({
            channelId: CHANNEL_ID,
            content: 'hola a todos',
        });
        await responder.idle();

        expect(log).toEqual([]);
    });

    it('named bots answer in definition order, one at a time', async () => {
        const { log, calls, responder } = setup();

        responder.onHumanMessage({
            channelId: CHANNEL_ID,
            content: 'pedro y chayanne',
        });
        await flush();
        expect(calls).toHaveLength(1);
        expect(log.at(-1)).toBe('generate:chayanne');

        calls[0].resolve({ text: 'Hola mi amor!', truncated: false });
        await flush();
        expect(calls).toHaveLength(2);
        expect(log).toEqual([
            `typing:${chayanne.user.id}:true`,
            'generate:chayanne',
            `post:${chayanne.user.id}:Hola mi amor!`,
            `typing:${chayanne.user.id}:false`,
            `typing:${pedro.user.id}:true`,
            'generate:pedro_pascal',
        ]);

        calls[1].resolve({ text: 'Qué tal.', truncated: false });
        await responder.idle();
        expect(log.at(-2)).toBe(`post:${pedro.user.id}:Qué tal.`);
    });

    it('the bot types while it generates', async () => {
        const { log, calls, responder } = setup();

        responder.onHumanMessage({ channelId: CHANNEL_ID, content: 'pedro' });
        await flush();
        calls[0].resolve({ text: 'pedro_pascal: Hola.', truncated: false });
        await responder.idle();

        expect(log).toEqual([
            `typing:${pedro.user.id}:true`,
            'generate:pedro_pascal',
            `post:${pedro.user.id}:Hola.`,
            `typing:${pedro.user.id}:false`,
        ]);
    });

    it.each([
        ['an empty reply', { text: '  ', truncated: false }],
        ['null', null],
    ])('%s posts nothing and stops typing', async (_, value) => {
        const { log, calls, deps, responder } = setup();

        responder.onHumanMessage({ channelId: CHANNEL_ID, content: 'pedro' });
        await flush();
        calls[0].resolve(value);
        await responder.idle();

        expect(deps.post).not.toHaveBeenCalled();
        expect(log.at(-1)).toBe(`typing:${pedro.user.id}:false`);
    });

    it('a failing generate stops typing, posts nothing, and the next bot still answers', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { log, calls, deps, responder } = setup();

        responder.onHumanMessage({
            channelId: CHANNEL_ID,
            content: 'chayanne, pedro',
        });
        await flush();
        calls[0].reject(new Error('model crashed'));
        await flush();
        expect(log.slice(0, 3)).toEqual([
            `typing:${chayanne.user.id}:true`,
            'generate:chayanne',
            `typing:${chayanne.user.id}:false`,
        ]);

        calls[1].resolve({ text: 'Aquí estoy.', truncated: false });
        await responder.idle();

        expect(deps.post).toHaveBeenCalledTimes(1);
        expect(deps.post).toHaveBeenCalledWith({
            botId: pedro.user.id,
            channelId: CHANNEL_ID,
            content: 'Aquí estoy.',
        });
        expect(console.error).toHaveBeenCalled();
    });

    it('a reply is cut to the maximum message length', async () => {
        const { calls, deps, responder } = setup();

        responder.onHumanMessage({ channelId: CHANNEL_ID, content: 'pedro' });
        await flush();
        calls[0].resolve({ text: 'x'.repeat(3000), truncated: false });
        await responder.idle();

        expect(deps.post).toHaveBeenCalledWith(
            expect.objectContaining({
                content: 'x'.repeat(MAX_MESSAGE_LENGTH),
            }),
        );
    });

    it('a disabled bot never answers, even when named', async () => {
        const { log, calls, settings, responder } = setup();
        settings.disabledBotIds = [chayanne.user.id];

        responder.onHumanMessage({
            channelId: CHANNEL_ID,
            content: 'chayanne y pedro',
        });
        await flush();
        expect(calls).toHaveLength(1);
        calls[0].resolve({ text: 'Hola.', truncated: false });
        await responder.idle();

        expect(log).toEqual([
            `typing:${pedro.user.id}:true`,
            'generate:pedro_pascal',
            `post:${pedro.user.id}:Hola.`,
            `typing:${pedro.user.id}:false`,
        ]);
    });

    it('each bot reads the settings at its turn: temperature, max new tokens and history limit', async () => {
        const { calls, deps, settings, responder } = setup();
        deps.history = () =>
            Array.from({ length: 5 }, (_, i) => ({
                authorId: 'u1',
                authorName: 'ana',
                content: `m${i}`,
            }));
        Object.assign(settings, {
            temperature: 0.8,
            maxNewTokens: 50,
            historyLimit: 2,
        });

        responder.onHumanMessage({
            channelId: CHANNEL_ID,
            content: 'chayanne y pedro',
        });
        await flush();
        expect(calls[0]).toMatchObject({ temperature: 0.8, maxNewTokens: 50 });
        expect(calls[0].messages.slice(1).map((m) => m.content)).toEqual([
            'ana: m3',
            'ana: m4',
        ]);

        // A change applies to the next reply.
        Object.assign(settings, { temperature: 1.2, historyLimit: 1 });
        calls[0].resolve(null);
        await flush();
        expect(calls[1]).toMatchObject({ temperature: 1.2, maxNewTokens: 50 });
        expect(calls[1].messages).toHaveLength(2);
        calls[1].resolve(null);
        await responder.idle();
    });
});
