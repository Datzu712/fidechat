import { Logger } from '@nestjs/common';

import type { AIService } from '@/modules/ai/ai.service.js';
import { BOTS } from '@/modules/ai/bots.js';
import type { ChannelHistoryEntry } from '@/modules/ai/prompt.js';
import type { PlannedSpeaker } from '@/modules/ai/router.js';
import type { Channel } from '@/modules/channel/channel.repository.js';
import type { PresenceService } from '@/modules/gateway/presence.service.js';
import type { SocketEmitter } from '@/modules/gateway/socket-emitter.js';
import { BotConversationService } from '@/modules/message/bot-conversation.service.js';
import type { MessageCreationAttributes, MessageRepository } from '@/modules/message/message.repository.js';
import type { UserRepository } from '@/modules/user/user.repository.js';

const [, chayanne, pedro] = BOTS;
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
        async (bot: PlannedSpeaker['bot'], _history: ChannelHistoryEntry[]): Promise<string | null> =>
            `reply from ${bot.user.username}`,
    );
    const ai = { enabled: true, routerEnabled: true, route, reply };
    const presence = { startBotTyping: jest.fn(), stopBotTyping: jest.fn() };
    const userRepository = { getGuildUsers: jest.fn(async () => [{ id: 'u1' }]) };
    const emitter = { emitToUsers: jest.fn() };

    const service = new BotConversationService(
        messageRepository as unknown as MessageRepository,
        ai as unknown as AIService,
        presence as unknown as PresenceService,
        userRepository as unknown as UserRepository,
        emitter as unknown as SocketEmitter,
    );

    const say = (content: string) => {
        const id = store('u1', 'juan', content);
        service.onHumanMessage(channel, id, content);
        return id;
    };

    return { service, say, route, reply, messages };
}

describe('BotConversationService', () => {
    beforeAll(() => Logger.overrideLogger(false));

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('waits for 2.5 s of silence before routing', async () => {
        const { say, route } = setup();

        say('hola');
        await jest.advanceTimersByTimeAsync(1000);
        say('¿cómo están?');

        await jest.advanceTimersByTimeAsync(2499);
        expect(route).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1);
        expect(route).toHaveBeenCalledTimes(1);
    });

    it('answers a named bot when the router fails', async () => {
        const { say, route, reply } = setup();
        route.mockResolvedValue(null);

        say('chayanne hola');
        await jest.advanceTimersByTimeAsync(2500);

        expect(reply).toHaveBeenCalledTimes(1);
        expect(reply.mock.calls[0][0]).toBe(chayanne);
    });

    it('second speaker sees the first reply', async () => {
        const { say, route, reply } = setup();
        route.mockResolvedValueOnce([
            { bot: chayanne, kind: 'addressed' },
            { bot: pedro, kind: 'addressed' },
        ]);

        say('¿quién baila mejor?');
        await jest.advanceTimersByTimeAsync(2500);

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
        await jest.advanceTimersByTimeAsync(2500);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne, pedro]);
        expect(route).toHaveBeenCalledTimes(2);
        expect(route.mock.calls[1][2]).toContain(chayanne);
    });

    it('a human message during a reply skips the remaining turns and routes again', async () => {
        const { say, route, reply } = setup();
        route.mockResolvedValueOnce([
            { bot: chayanne, kind: 'addressed' },
            { bot: pedro, kind: 'addressed' },
        ]);
        const firstReply = Promise.withResolvers<string | null>();
        reply.mockImplementationOnce(async () => firstReply.promise);

        say('¿quién baila mejor?');
        await jest.advanceTimersByTimeAsync(2500);
        expect(reply).toHaveBeenCalledTimes(1);

        say('esperen, otra cosa');
        firstReply.resolve('¡yo, mi amor!');
        await jest.advanceTimersByTimeAsync(0);

        expect(reply).toHaveBeenCalledTimes(1);
        expect(route).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(2500);
        expect(route).toHaveBeenCalledTimes(2);
        expect(reply.mock.calls.map(([bot]) => bot)).not.toContain(pedro);
    });

    it('a cycle queued behind a running one waits for the debounce of newer messages', async () => {
        const { say, route, reply } = setup();
        route.mockResolvedValueOnce([{ bot: chayanne, kind: 'addressed' }]);
        const firstReply = Promise.withResolvers<string | null>();
        reply.mockImplementationOnce(async () => firstReply.promise);

        say('chayanne, ¿qué cantas?');
        await jest.advanceTimersByTimeAsync(2500);
        const h2 = say('otra cosa');
        // H2's timer fires while the first cycle is still replying, so its cycle is queued behind it.
        await jest.advanceTimersByTimeAsync(2500);
        await jest.advanceTimersByTimeAsync(500);
        const h3 = say('y otra más');

        firstReply.resolve('¡Torero!');
        await jest.advanceTimersByTimeAsync(0);
        expect(route).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(2499);
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
        await jest.advanceTimersByTimeAsync(2500);
        expect(route).toHaveBeenCalledTimes(2);

        say('esperen');
        reask.resolve([{ bot: pedro, kind: 'spontaneous' }]);
        await jest.advanceTimersByTimeAsync(0);

        expect(reply.mock.calls.map(([bot]) => bot)).toEqual([chayanne]);
    });

    it('caps spontaneous replies across cycles', async () => {
        const { say, route, reply } = setup();
        route.mockImplementation(async (_history, _ids, exclude = []) =>
            exclude.length > 0 ? [] : [{ bot: pedro, kind: 'spontaneous' }],
        );

        say('vi The Last of Us anoche');
        await jest.advanceTimersByTimeAsync(2500);
        await jest.advanceTimersByTimeAsync(60_000);
        say('qué buena serie');
        await jest.advanceTimersByTimeAsync(2500);

        expect(route.mock.calls.filter(([, , exclude = []]) => exclude.length === 0)).toHaveLength(2);
        expect(reply).toHaveBeenCalledTimes(1);
        expect(reply.mock.calls[0][0]).toBe(pedro);
    });

    it('does nothing after module destroy', async () => {
        const { service, say, route, reply } = setup();

        say('chayanne hola');
        service.onModuleDestroy();
        await jest.advanceTimersByTimeAsync(5000);

        expect(route).not.toHaveBeenCalled();
        expect(reply).not.toHaveBeenCalled();
    });
});
