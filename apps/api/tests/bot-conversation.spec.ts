import { Logger } from '@nestjs/common';

import type { AIService } from '@/modules/ai/ai.service.js';
import { BOTS } from '@/modules/ai/bots.js';
import type { ChannelHistoryEntry } from '@/modules/ai/prompt.js';
import type { PlannedSpeaker } from '@/modules/ai/router.js';
import { SpeakerSelector } from '@/modules/ai/speaker-selector.js';
import type { Channel } from '@/modules/channel/channel.repository.js';
import type { PresenceService } from '@/modules/gateway/presence.service.js';
import type { SocketEmitter } from '@/modules/gateway/socket-emitter.js';
import { BotConversationService } from '@/modules/message/bot-conversation/bot-conversation.service.js';
import { typingDelayMs } from '@/modules/message/bot-conversation/bot-conversation.util.js';
import type { MessageCreationAttributes, MessageRepository } from '@/modules/message/message.repository.js';
import type { UserRepository } from '@/modules/user/user.repository.js';

const [, chayanne, pedro] = BOTS;
const DEBOUNCE = 600;
const READ_PAUSE = 1200;
/** How long the typing indicator holds `text` when generation was instant (fake timers), rounded up to whole ms. */
const typing = (text: string) => Math.ceil(typingDelayMs(text.length, 0));
const replyOf = (bot: PlannedSpeaker['bot']) => `reply from ${bot.user.username}`;
const channel: Channel = { id: 'c1', guildId: 'g1', name: 'general', description: null, position: 0 };

type Route = (
    history: ChannelHistoryEntry[],
    newIds: ReadonlySet<string>,
    exclude?: ReadonlyArray<PlannedSpeaker['bot']>,
) => Promise<PlannedSpeaker[] | null>;

function setup() {
    const messages: ChannelHistoryEntry[] = [];
    let nextId = 0;
    const store = (authorId: string, authorName: string, content: string) => {
        const id = `m${++nextId}`;
        messages.push({ id, authorId, authorName, content });
        return id;
    };

    const messageRepository = {
        getRecentMessages: jest.fn(async (_channelId: string, limit: number) => messages.slice(-limit)),
        createMessage: jest.fn(async ({ authorId, content }: MessageCreationAttributes) => {
            const bot = BOTS.find((candidate) => candidate.user.id === authorId);
            return { id: store(authorId, bot?.user.username ?? authorId, content) };
        }),
    };
    const route = jest.fn<ReturnType<Route>, Parameters<Route>>().mockResolvedValue([]);
    const reply = jest.fn(
        async (
            bot: PlannedSpeaker['bot'],
            _history: ChannelHistoryEntry[],
            _reactingTo?: ReadonlyArray<PlannedSpeaker['bot']>,
        ): Promise<string | null> => `reply from ${bot.user.username}`,
    );
    const ai = { enabled: true, routerEnabled: true, route, reply };
    const presence = { startBotTyping: jest.fn(), stopBotTyping: jest.fn() };
    const userRepository = { getGuildUsers: jest.fn(async () => [{ id: 'u1' }]) };
    const emitter = { emitToUsers: jest.fn() };

    const service = new BotConversationService(
        messageRepository as unknown as MessageRepository,
        ai as unknown as AIService,
        new SpeakerSelector(ai as unknown as AIService),
        presence as unknown as PresenceService,
        userRepository as unknown as UserRepository,
        emitter as unknown as SocketEmitter,
    );

    const say = (content: string) => {
        const id = store('u1', 'juan', content);
        service.onHumanMessage(channel, id, content);
        return id;
    };

    return { service, say, ai, route, reply, messages, messageRepository };
}

describe('typingDelayMs', () => {
    it('holds an 80-char message for 2 s when generation was instant', () => expect(typingDelayMs(80, 0)).toBe(2000));
    it('subtracts the generation time', () => expect(typingDelayMs(80, 1500)).toBe(500));
    it('caps at 3 s', () => expect(typingDelayMs(1000, 0)).toBe(3000));
    it('never goes negative', () => expect(typingDelayMs(10, 3000)).toBe(0));
});

describe('BotConversationService', () => {
    beforeAll(() => Logger.overrideLogger(false));

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('waits for 0.6 s of silence before routing', async () => {
        const { say, route } = setup();

        say('hola');
        await jest.advanceTimersByTimeAsync(500);
        say('¿cómo están?');

        await jest.advanceTimersByTimeAsync(599);
        expect(route).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1);
        expect(route).toHaveBeenCalledTimes(1);
    });

    it('answers a named bot when the router fails', async () => {
        const { say, route, reply } = setup();
        route.mockResolvedValue(null);

        say('chayanne hola');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);

        expect(reply).toHaveBeenCalledTimes(1);
        expect(reply.mock.calls[0][0]).toBe(chayanne);
    });

    it('two addressed speakers reply in parallel', async () => {
        const { say, route, reply, messageRepository } = setup();
        // Pedro is planned first but types the longer reply, so chayanne posts first.
        route.mockResolvedValueOnce([
            { bot: pedro, kind: 'addressed' },
            { bot: chayanne, kind: 'addressed' },
        ]);
        const authors = () => messageRepository.createMessage.mock.calls.map(([message]) => message.authorId);

        say('¿quién baila mejor?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([pedro, chayanne]);
        expect(messageRepository.createMessage).not.toHaveBeenCalled();
        for (const [bot, history] of reply.mock.calls) {
            const other = bot === pedro ? chayanne : pedro;
            expect(history).not.toContainEqual(expect.objectContaining({ authorId: other.user.id }));
        }

        await jest.advanceTimersByTimeAsync(typing(replyOf(chayanne)));
        expect(authors()).toEqual([chayanne.user.id]);

        await jest.advanceTimersByTimeAsync(typing(replyOf(pedro)) - typing(replyOf(chayanne)));
        expect(authors()).toEqual([chayanne.user.id, pedro.user.id]);
    });

    it('a spontaneous speaker after an addressed one stays sequential and sees it', async () => {
        const { say, route, reply } = setup();
        route
            .mockResolvedValueOnce([
                { bot: chayanne, kind: 'addressed' },
                { bot: pedro, kind: 'spontaneous' },
            ])
            .mockResolvedValueOnce([{ bot: pedro, kind: 'spontaneous' }]);

        say('chayanne, ¿quién baila mejor?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE + typing(replyOf(chayanne)) + READ_PAUSE - 1);
        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne]);

        await jest.advanceTimersByTimeAsync(1);
        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne, pedro]);
        const pedroHistory = reply.mock.calls[1][1];
        expect(pedroHistory).toContainEqual(
            expect.objectContaining({ authorId: chayanne.user.id, content: 'reply from chayanne' }),
        );
    });

    it('reacts at most once and never with a bot that spoke', async () => {
        const { say, route, reply } = setup();
        route.mockResolvedValueOnce([{ bot: chayanne, kind: 'addressed' }]).mockResolvedValueOnce([
            { bot: chayanne, kind: 'spontaneous' },
            { bot: pedro, kind: 'spontaneous' },
        ]);

        say('¿qué música ponemos?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE + typing(replyOf(chayanne)) + READ_PAUSE);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne, pedro]);
        expect(route).toHaveBeenCalledTimes(2);
        expect(route.mock.calls[1][2]).toContain(chayanne);
    });

    it('tells the reacting bot whose replies it reacts to, and only that bot', async () => {
        const { say, route, reply } = setup();
        route
            .mockResolvedValueOnce([{ bot: chayanne, kind: 'addressed' }])
            .mockResolvedValueOnce([{ bot: pedro, kind: 'spontaneous' }]);

        say('¿qué música ponemos?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE + typing(replyOf(chayanne)) + READ_PAUSE);

        expect(reply.mock.calls.map(([bot, , reactingTo]) => [bot, reactingTo])).toEqual([
            [chayanne, undefined],
            [pedro, [chayanne]],
        ]);
    });

    it('a human message during a reply skips the remaining turns and routes again', async () => {
        const { say, route, reply } = setup();
        route.mockResolvedValueOnce([
            { bot: chayanne, kind: 'addressed' },
            { bot: pedro, kind: 'spontaneous' },
        ]);
        const firstReply = Promise.withResolvers<string | null>();
        reply.mockImplementationOnce(async () => firstReply.promise);

        say('¿quién baila mejor?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        expect(reply).toHaveBeenCalledTimes(1);

        say('esperen, otra cosa');
        firstReply.resolve('¡yo, mi amor!');
        await jest.advanceTimersByTimeAsync(0);

        expect(reply).toHaveBeenCalledTimes(1);
        expect(route).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        expect(route).toHaveBeenCalledTimes(2);
        expect(reply.mock.calls.map(([bot]) => bot)).not.toContain(pedro);
    });

    it('a human message during a reply still lets the named bots answer, but skips the reaction', async () => {
        const { say, route, reply, messageRepository } = setup();
        route.mockResolvedValueOnce([{ bot: chayanne, kind: 'addressed' }]);
        const firstReply = Promise.withResolvers<string | null>();
        reply.mockImplementationOnce(async () => firstReply.promise);

        say('pedro y chayanne, ¿quién baila mejor?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        say('jaja');
        firstReply.resolve('¡yo, mi amor!');
        // Both have posted, and the 'jaja' debounce has not fired yet.
        await jest.advanceTimersByTimeAsync(Math.max(typing('¡yo, mi amor!'), typing(replyOf(pedro))));

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne, pedro]);
        expect(messageRepository.createMessage).toHaveBeenCalledTimes(2);
        expect(route).toHaveBeenCalledTimes(1);
        expect(route.mock.calls.filter(([, , exclude]) => exclude !== undefined)).toHaveLength(0);
    });

    it('a human message during parallel generation still posts both addressed replies, then skips the reaction', async () => {
        const { say, route, reply, messageRepository } = setup();
        const chayanneReply = Promise.withResolvers<string | null>();
        const pedroReply = Promise.withResolvers<string | null>();
        reply
            .mockImplementationOnce(async () => chayanneReply.promise)
            .mockImplementationOnce(async () => pedroReply.promise);

        say('chayanne y pedro, ¿quién baila mejor?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne, pedro]);

        say('jaja');
        chayanneReply.resolve('¡yo, mi amor!');
        pedroReply.resolve('yo no bailo');
        await jest.advanceTimersByTimeAsync(Math.max(typing('¡yo, mi amor!'), typing('yo no bailo')));

        // Completion order: pedro's shorter reply posts first.
        expect(messageRepository.createMessage.mock.calls.map(([message]) => message.authorId)).toEqual([
            pedro.user.id,
            chayanne.user.id,
        ]);
        expect(route).toHaveBeenCalledTimes(1);
        expect(route.mock.calls.filter(([, , exclude]) => exclude !== undefined)).toHaveLength(0);
    });

    it('a human message during the read pause skips an unnamed spontaneous speaker', async () => {
        const { say, route, reply } = setup();
        route.mockResolvedValueOnce([
            { bot: chayanne, kind: 'addressed' },
            { bot: pedro, kind: 'spontaneous' },
        ]);

        const first = say('¿quién baila mejor?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE + typing(replyOf(chayanne)));
        say('esperen');
        await jest.advanceTimersByTimeAsync(READ_PAUSE);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne]);
        // Skipped right after the pause, without re-asking the router.
        expect(route.mock.calls.filter(([, ids]) => ids.has(first))).toHaveLength(1);
    });

    it('a human message while routing skips an unnamed addressed speaker but lets a named one answer', async () => {
        const { say, route, reply } = setup();
        const decision = Promise.withResolvers<PlannedSpeaker[] | null>();
        route.mockImplementationOnce(async () => decision.promise);

        say('pedro, ¿y tú qué bailas?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        say('jaja');
        decision.resolve([{ bot: chayanne, kind: 'addressed' }]);
        await jest.advanceTimersByTimeAsync(0);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([pedro]);
    });

    it('a human message during the reaction read pause skips the reaction', async () => {
        const { say, route, reply } = setup();
        route
            .mockResolvedValueOnce([{ bot: chayanne, kind: 'addressed' }])
            .mockResolvedValueOnce([{ bot: pedro, kind: 'spontaneous' }]);

        say('chayanne, ¿qué música ponemos?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE + typing(replyOf(chayanne)));
        expect(route).toHaveBeenCalledTimes(2);
        say('esperen');
        await jest.advanceTimersByTimeAsync(READ_PAUSE);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne]);
    });

    it('a human message while routing still lets the named bot answer', async () => {
        const { say, route, reply } = setup();
        const decision = Promise.withResolvers<PlannedSpeaker[] | null>();
        route.mockImplementationOnce(async () => decision.promise);

        say('chayanne, ¿qué cantas?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        expect(route).toHaveBeenCalledTimes(1);

        say('jaja');
        decision.resolve([]);
        await jest.advanceTimersByTimeAsync(0);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne]);
    });

    it('a cycle queued behind a running one waits for the debounce of newer messages', async () => {
        const { say, route, reply } = setup();
        route.mockResolvedValueOnce([{ bot: chayanne, kind: 'addressed' }]);
        const firstReply = Promise.withResolvers<string | null>();
        reply.mockImplementationOnce(async () => firstReply.promise);

        say('chayanne, ¿qué cantas?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        const h2 = say('otra cosa');
        // H2's timer fires while the first cycle is still replying, so its cycle is queued behind it.
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        await jest.advanceTimersByTimeAsync(500);
        const h3 = say('y otra más');

        firstReply.resolve('¡Torero!');
        await jest.advanceTimersByTimeAsync(0);
        expect(route).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(DEBOUNCE - 1);
        expect(route).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(1);
        await jest.advanceTimersByTimeAsync(5000);
        expect(route).toHaveBeenCalledTimes(2);
        expect([...route.mock.calls[1][1]]).toEqual([h2, h3]);
        expect(route.mock.calls.filter(([, ids]) => ids.size === 0)).toHaveLength(0);
    });

    it('a human message during the re-ask stops a spontaneous second speaker', async () => {
        const { say, route, reply } = setup();
        route.mockResolvedValueOnce([
            { bot: chayanne, kind: 'addressed' },
            { bot: pedro, kind: 'spontaneous' },
        ]);
        const reask = Promise.withResolvers<PlannedSpeaker[] | null>();
        route.mockImplementationOnce(async () => reask.promise);

        say('chayanne, ¿qué series ves?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE + typing(replyOf(chayanne)) + READ_PAUSE);
        expect(route).toHaveBeenCalledTimes(2);

        say('esperen');
        reask.resolve([{ bot: pedro, kind: 'spontaneous' }]);
        await jest.advanceTimersByTimeAsync(0);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne]);
    });

    it('a spontaneous second speaker speaks when the re-ask confirms it', async () => {
        const { say, route, reply } = setup();
        route
            .mockResolvedValueOnce([
                { bot: chayanne, kind: 'addressed' },
                { bot: pedro, kind: 'spontaneous' },
            ])
            .mockResolvedValueOnce([{ bot: pedro, kind: 'spontaneous' }]);

        say('chayanne, ¿qué series ves?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE + typing(replyOf(chayanne)) + READ_PAUSE);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne, pedro]);
    });

    it('a spontaneous second speaker stays silent when the re-ask drops it', async () => {
        const { say, route, reply } = setup();
        route
            .mockResolvedValueOnce([
                { bot: chayanne, kind: 'addressed' },
                { bot: pedro, kind: 'spontaneous' },
            ])
            .mockResolvedValueOnce([]);

        say('chayanne, ¿qué series ves?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE + typing(replyOf(chayanne)) + READ_PAUSE);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne]);
    });

    it('caps spontaneous replies across cycles', async () => {
        const { say, route, reply } = setup();
        route.mockImplementation(async (_history, _ids, exclude = []) =>
            exclude.length > 0 ? [] : [{ bot: pedro, kind: 'spontaneous' }],
        );

        say('vi The Last of Us anoche');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        await jest.advanceTimersByTimeAsync(60_000);
        say('qué buena serie');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);

        expect(route.mock.calls.filter(([, , exclude = []]) => exclude.length === 0)).toHaveLength(2);
        expect(reply).toHaveBeenCalledTimes(1);
        expect(reply.mock.calls[0][0]).toBe(pedro);
    });

    it('does not use up the cap when a spontaneous reply fails', async () => {
        const { say, route, reply } = setup();
        route.mockImplementation(async (_history, _ids, exclude = []) =>
            exclude.length > 0 ? [] : [{ bot: pedro, kind: 'spontaneous' }],
        );
        reply.mockResolvedValueOnce(null);

        say('vi The Last of Us anoche');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        await jest.advanceTimersByTimeAsync(60_000);
        say('qué buena serie');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([pedro, pedro]);
    });

    it('does not use up the cap when a reaction fails', async () => {
        const { say, route, reply } = setup();
        route.mockImplementation(async (_history, _ids, exclude = []) =>
            exclude.length > 0 ? [{ bot: pedro, kind: 'spontaneous' }] : [{ bot: chayanne, kind: 'addressed' }],
        );
        reply.mockImplementation(async (bot) => (bot === pedro && reply.mock.calls.length === 2 ? null : replyOf(bot)));

        say('chayanne, ¿qué cantas hoy?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE + typing(replyOf(chayanne)) + READ_PAUSE);
        await jest.advanceTimersByTimeAsync(60_000);
        say('chayanne, ¿y mañana?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE + typing(replyOf(chayanne)) + READ_PAUSE);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne, pedro, chayanne, pedro]);
    });

    it('posts a reply only after its typing delay', async () => {
        const { say, route, reply, messageRepository } = setup();
        route.mockResolvedValueOnce([{ bot: chayanne, kind: 'addressed' }]);
        // 54 characters: 1.35 seconds of typing.
        reply.mockResolvedValueOnce('¡Hola, mi amor! Qué alegría verte por aquí esta noche.');

        say('chayanne hola');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        expect(reply).toHaveBeenCalledTimes(1);
        expect(messageRepository.createMessage).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1349);
        expect(messageRepository.createMessage).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1);
        expect(messageRepository.createMessage).toHaveBeenCalledTimes(1);
    });

    it('does nothing after module destroy', async () => {
        const { service, say, route, reply } = setup();

        say('chayanne hola');
        service.onModuleDestroy();
        await jest.advanceTimersByTimeAsync(5000);

        expect(route).not.toHaveBeenCalled();
        expect(reply).not.toHaveBeenCalled();
    });

    it('answers the named bot without routing when the router is disabled', async () => {
        const { say, ai, route, reply } = setup();
        ai.routerEnabled = false;

        say('chayanne hola');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);

        expect(route).not.toHaveBeenCalled();
        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne]);
    });

    it('stops a running cycle on module destroy', async () => {
        const { service, say, route, reply, messageRepository } = setup();
        route.mockResolvedValueOnce([
            { bot: chayanne, kind: 'addressed' },
            { bot: pedro, kind: 'spontaneous' },
        ]);
        const firstReply = Promise.withResolvers<string | null>();
        reply.mockImplementationOnce(async () => firstReply.promise);

        say('¿quién baila mejor?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        service.onModuleDestroy();
        firstReply.resolve('¡yo, mi amor!');
        await jest.advanceTimersByTimeAsync(typing('¡yo, mi amor!') + READ_PAUSE);

        expect(reply).toHaveBeenCalledTimes(1);
        expect(route).toHaveBeenCalledTimes(1);
        expect(messageRepository.createMessage).not.toHaveBeenCalled();
    });

    it('posts nothing from a parallel run after module destroy', async () => {
        const { service, say, route, reply, messageRepository } = setup();
        route.mockResolvedValueOnce([
            { bot: chayanne, kind: 'addressed' },
            { bot: pedro, kind: 'addressed' },
        ]);

        say('¿quién baila mejor?');
        await jest.advanceTimersByTimeAsync(DEBOUNCE);
        expect(reply).toHaveBeenCalledTimes(2);

        service.onModuleDestroy();
        await jest.advanceTimersByTimeAsync(Math.max(typing(replyOf(chayanne)), typing(replyOf(pedro))));

        expect(messageRepository.createMessage).not.toHaveBeenCalled();
    });
});
