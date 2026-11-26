import { BOT_DEFINITIONS, SocketEvents } from '@fidechat/shared';
import { describe, expect, it, vi } from 'vitest';

import type { Generated } from '@/shared/backend/local/model/model-protocol';
import type { TabMessage } from '@/shared/backend/local/protocol';
import { createServerLogs } from '@/shared/backend/local/server/logs/logs';
import { ROUTES } from '@/shared/backend/local/server/logs/routes';
import type {
    LocalServer,
    ServerDeps,
} from '@/shared/backend/local/server/server';

/** The console line as printed, without the `%c` style markers. */
const plain = (args: unknown[]) => (args[0] as string).replaceAll('%c', '');

/** Logs over fakes; `lines()` is what was printed, without styles. */
function setup() {
    let t = 0;
    const print = vi.fn((..._args: unknown[]) => {});
    const logs = createServerLogs({
        print,
        now: () => new Date('2026-11-26T09:05:03.007Z'),
        clock: () => t,
        pid: 4242,
        origin: 'http://localhost:3000',
        userAgent: 'test',
    });
    const watchers: Array<() => void> = [];
    const original = {
        post: vi.fn<ServerDeps['post']>(),
        watchTab: vi.fn<ServerDeps['watchTab']>((_tabId, onGone) => {
            watchers.push(onGone);
        }),
        generate: vi.fn<ServerDeps['generate']>(
            async (): Promise<Generated | null> => null,
        ),
        store: { load: vi.fn(), save: vi.fn(), clear: vi.fn() },
        newId: () => 'id',
        now: () => new Date(),
    } satisfies ServerDeps;
    const deps = logs.wrapDeps(original);
    const handle = vi.fn<LocalServer['handle']>(async () => {});
    const server = logs.wrapServer({ handle });
    return {
        logs,
        print,
        original,
        deps,
        handle,
        server,
        watchers,
        advance: (ms: number) => {
            t += ms;
        },
        lines: () => print.mock.calls.map((args) => plain(args)),
    };
}

const request = (requestId: string): TabMessage => ({
    type: 'request',
    tabId: 't1',
    requestId,
    request: {
        op: 'createMessage',
        guildId: 'g1',
        channelId: 'c1',
        payload: { content: 'hola' },
    },
});

describe('createServerLogs', () => {
    it('boot logs the Nest startup and every route', () => {
        const { logs, lines } = setup();
        logs.boot();

        expect(lines()[0]).toContain(
            'INFO (4242): Starting Nest application... {"context":"NestFactory"}',
        );
        expect(lines()).toContain(
            '[09:05:03.007] INFO (4242): Mapped {/api/v1/guilds/:guildId/channels/:channelId/messages, POST} route {"context":"RouterExplorer"}',
        );
        expect(lines()).toContain(
            '[09:05:03.007] INFO (4242): GuildController {/api/v1/guilds}: {"context":"RoutesResolver"}',
        );
        const mapped = lines().filter((line) => line.includes('Mapped {'));
        expect(mapped).toHaveLength(Object.keys(ROUTES).length);
    });

    it('ready logs the application url', () => {
        const { deps, original, lines } = setup();
        deps.post({ type: 'ready' });

        expect(lines().at(-1)).toContain(
            'Application is running on: http://localhost:3000 as backendless environment.',
        );
        expect(original.post).toHaveBeenCalledWith({ type: 'ready' });
    });

    it('logs a request when its response is posted', async () => {
        const { server, deps, advance, lines, handle } = setup();
        await server.handle(request('r1'));
        expect(handle).toHaveBeenCalledWith(request('r1'));
        expect(lines()).toEqual([]);

        advance(3.4);
        deps.post({
            type: 'response',
            tabId: 't1',
            requestId: 'r1',
            ok: true,
            result: null,
        });

        expect(lines()).toEqual([
            '[09:05:03.007] INFO (4242): request completed {"req":{"id":"req-1","method":"POST","url":"/api/v1/guilds/g1/channels/c1/messages","remoteAddress":"127.0.0.1","userAgent":"test"},"res":{"statusCode":201},"responseTime":3}',
        ]);
    });

    it('a rejected request logs a warning with its status', async () => {
        const { server, deps, lines } = setup();
        await server.handle(request('r1'));
        await server.handle(request('r2'));
        deps.post({
            type: 'response',
            tabId: 't1',
            requestId: 'r1',
            ok: false,
            error: { message: 'no', status: 403 },
        });
        deps.post({
            type: 'response',
            tabId: 't1',
            requestId: 'r2',
            ok: false,
            error: { message: 'boom', status: 500 },
        });

        expect(lines()[0]).toMatch(
            /WARN \(4242\): request completed .*"statusCode":403/,
        );
        expect(lines()[1]).toMatch(
            /ERROR \(4242\): request errored .*"id":"req-2".*"statusCode":500/,
        );
    });

    it('a response with an unknown id logs nothing', () => {
        const { deps, lines } = setup();
        deps.post({
            type: 'response',
            tabId: 't1',
            requestId: 'nope',
            ok: true,
            result: null,
        });

        expect(lines()).toEqual([]);
    });

    it("hello logs a connection only when the tab's user changes", async () => {
        const { server, lines } = setup();
        await server.handle({ type: 'hello', tabId: 't1', userId: null });
        await server.handle({ type: 'hello', tabId: 't1', userId: 'u1' });
        await server.handle({ type: 'hello', tabId: 't1', userId: 'u1' });
        await server.handle({ type: 'hello', tabId: 't1', userId: null });

        expect(lines()).toEqual([
            '[09:05:03.007] DEBUG (4242): Socket t1 connected with user data: {"sub":"u1"} (local - socket: t1) {"context":"SocketGateway"}',
            '[09:05:03.007] DEBUG (4242): Socket t1 disconnected. {"context":"SocketGateway"}',
        ]);
    });

    it('a closed tab logs a disconnection once', async () => {
        const { server, deps, watchers, lines } = setup();
        const gone = vi.fn();
        const silent = vi.fn();
        await server.handle({ type: 'hello', tabId: 't1', userId: 'u1' });
        deps.watchTab('t1', gone);
        deps.watchTab('t2', silent);
        watchers[0]();
        watchers[1]();

        expect(gone).toHaveBeenCalledOnce();
        expect(silent).toHaveBeenCalledOnce();
        const left = lines().filter((line) => line.includes('disconnected'));
        expect(left).toEqual([
            '[09:05:03.007] DEBUG (4242): Socket t1 disconnected. {"context":"SocketGateway"}',
        ]);
    });

    it('an unserializable status update is still handled', async () => {
        const { server, handle, lines } = setup();
        const update: Record<string, unknown> = {};
        update.self = update;
        const message: TabMessage = { type: 'status', tabId: 't1', update };
        await server.handle(message);

        expect(lines()).toEqual([
            '[09:05:03.007] DEBUG (4242): User t1 updated status to: [unserializable] {"context":"SocketGateway"}',
        ]);
        expect(handle).toHaveBeenCalledWith(message);
    });

    it('logs the events it emits', () => {
        const { deps, lines } = setup();
        deps.post({
            type: 'event',
            to: ['u1', 'u2'],
            event: SocketEvents.GUILD_CREATE,
            payload: {},
        });
        deps.post({
            type: 'event',
            to: 'all',
            event: SocketEvents.FORCE_SYNC,
            payload: undefined,
        });

        expect(lines()).toEqual([
            '[09:05:03.007] DEBUG (4242): Emitting event guildCreate to users: u1, u2 {"context":"SocketEmitter"}',
            '[09:05:03.007] DEBUG (4242): Broadcasting event forceSync {"context":"SocketEmitter"}',
        ]);
    });

    it('a bot message logs its reply', () => {
        const { deps, lines } = setup();
        const [bot] = BOT_DEFINITIONS;
        deps.post({
            type: 'event',
            to: ['u1'],
            event: SocketEvents.MESSAGE_CREATE,
            payload: {
                id: 'm1',
                content: 'hola',
                authorId: bot.user.id,
                channelId: 'c1',
                createdAt: '2026-11-26T09:05:03.007Z',
            },
        });

        expect(lines()).toContain(
            `[09:05:03.007] DEBUG (4242): Channel c1: ${bot.user.username} replied (4 chars) {"context":"BotConversationService"}`,
        );
    });

    it('generate logs when no model is ready', async () => {
        const { deps, lines } = setup();
        const result = await deps.generate({
            messages: [],
            temperature: 0.3,
            maxNewTokens: 120,
        });

        expect(result).toBeNull();
        expect(lines()).toEqual([
            '[09:05:03.007] WARN (4242): No local model is ready: the bot stays silent {"context":"AIService"}',
        ]);
    });

    it('generate logs the reply time', async () => {
        const { deps, original, advance, lines } = setup();
        const generated = { text: 'hola', truncated: false };
        original.generate.mockImplementation(async () => {
            advance(1500.4);
            return generated;
        });
        const result = await deps.generate({
            messages: [],
            temperature: 0.3,
            maxNewTokens: 120,
        });

        expect(result).toBe(generated);
        expect(lines()).toEqual([
            '[09:05:03.007] DEBUG (4242): Reply generated in 1500 ms (4 chars) {"context":"AIService"}',
        ]);
    });

    it('logging never breaks the server', async () => {
        const { logs, server, deps, original, handle, watchers, print } =
            setup();
        print.mockImplementation(() => {
            throw new Error('console is gone');
        });
        const gone = vi.fn();

        logs.boot();
        await server.handle({ type: 'hello', tabId: 't1', userId: 'u1' });
        await server.handle(request('r1'));
        deps.post({ type: 'ready' });
        deps.watchTab('t1', gone);
        watchers[0]();
        await deps.generate({ messages: [], temperature: 0, maxNewTokens: 16 });

        expect(handle).toHaveBeenCalledTimes(2);
        expect(original.post).toHaveBeenCalledWith({ type: 'ready' });
        expect(gone).toHaveBeenCalledOnce();
        expect(original.generate).toHaveBeenCalledOnce();
    });
});
