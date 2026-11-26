import {
    BOT_DEFINITIONS,
    type ConnectedUser,
    type Message,
    SocketEvents,
    type SyncPayload,
} from '@fidechat/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    GenerateInput,
    Generated,
} from '@/shared/backend/local/model/model-protocol';
import {
    DEFAULT_BOT_SETTINGS,
    type LocalRequest,
    type ServerMessage,
    type TabMessage,
} from '@/shared/backend/local/protocol';
import {
    createSeed,
    ensureBots,
} from '@/shared/backend/local/server/data/seed';
import type { LocalState } from '@/shared/backend/local/server/data/state';
import type { SnapshotStore } from '@/shared/backend/local/server/data/store';
import { createServer } from '@/shared/backend/local/server/server';

const NOW = new Date('2026-11-20T12:00:00.000Z');
const seed = createSeed(NOW);
const [alice, bruno] = seed.users;
const { guildId, id: channelId } = seed.channels[0];
const [, , pedro] = BOT_DEFINITIONS;
/** The bots are always online, ahead of every human. */
const BOTS_ONLINE: ConnectedUser[] = BOT_DEFINITIONS.map(({ user }) => ({
    userId: user.id,
    status: 'online',
    isTyping: false,
}));

interface FakeStore extends SnapshotStore {
    state: LocalState | null;
    failLoad: boolean;
    failSave: boolean;
    saves: number;
    clears: number;
}

/**
 * Builds a server over fakes; `order` records saves and posted message types,
 * `savedAtPost` the saved state when each message was posted.
 */
async function setup(initial: LocalState | null = seed) {
    const order: string[] = [];
    const posted: ServerMessage[] = [];
    const savedAtPost: Array<LocalState | null> = [];
    const generate = vi.fn(
        async (_input: GenerateInput): Promise<Generated | null> => null,
    );
    const watchers = new Map<string, () => void>();
    const store: FakeStore = {
        state: initial,
        failLoad: false,
        failSave: false,
        saves: 0,
        clears: 0,
        async load() {
            if (store.failLoad) throw new Error('load failed');
            return store.state;
        },
        async save(state) {
            order.push('save');
            store.saves++;
            if (store.failSave) throw new Error('save failed');
            store.state = state;
        },
        async clear() {
            store.clears++;
            store.state = null;
        },
    };
    let ids = 0;
    let ticks = 0;
    const start = async () =>
        createServer({
            post(message) {
                order.push(message.type);
                posted.push(message);
                savedAtPost.push(store.state);
            },
            store,
            watchTab(tabId, onGone) {
                watchers.set(tabId, onGone);
            },
            newId: () => `id-${++ids}`,
            now: () => new Date(NOW.getTime() + 3_600_000 + ++ticks * 1000),
            generate,
        });

    return { order, posted, savedAtPost, generate, watchers, store, start };
}

type Setup = Awaited<ReturnType<typeof setup>>;

let requests = 0;
function request(
    tabId: string,
    body: LocalRequest,
): Extract<TabMessage, { type: 'request' }> {
    return {
        type: 'request',
        tabId,
        requestId: `r-${++requests}`,
        request: body,
    };
}

function lastResponse(posted: ServerMessage[]) {
    return posted.findLast((m) => m.type === 'response');
}

function statusEvents(posted: ServerMessage[]) {
    return posted.filter(
        (m) =>
            m.type === 'event' && m.event === SocketEvents.USER_STATUS_UPDATE,
    );
}

async function syncOf(
    ctx: Setup,
    server: { handle(m: TabMessage): Promise<void> },
    tabId: string,
) {
    await server.handle(request(tabId, { op: 'sync' }));
    const response = lastResponse(ctx.posted);
    if (response?.type !== 'response' || !response.ok) {
        throw new Error('sync failed');
    }
    return response.result as SyncPayload;
}

const createMessage = (content: string): LocalRequest => ({
    op: 'createMessage',
    guildId,
    channelId,
    payload: { content },
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('local server', () => {
    it('seeds and saves when the store is empty, then posts ready and a forceSync event to all', async () => {
        const ctx = await setup(null);
        await ctx.start();

        expect(ctx.store.state?.users).toEqual(ensureBots(seed).users);
        expect(ctx.store.state?.messages).toHaveLength(seed.messages.length);
        expect(ctx.order).toEqual(['save', 'ready', 'event']);
        expect(ctx.posted[1]).toEqual({
            type: 'event',
            to: 'all',
            event: SocketEvents.FORCE_SYNC,
            payload: undefined,
        });
    });

    it('seeds when the snapshot has another version', async () => {
        const ctx = await setup({ ...seed, version: 0, messages: [] });
        await ctx.start();

        expect(ctx.store.saves).toBe(1);
        expect(ctx.store.state?.version).toBe(seed.version);
        expect(ctx.store.state?.messages).toHaveLength(seed.messages.length);
    });

    it('seeds and keeps serving when loading fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const ctx = await setup();
        ctx.store.failLoad = true;
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });

        const sync = await syncOf(ctx, server, 't1');
        expect(sync.currentUser.id).toBe(alice.id);
        expect(ctx.store.saves).toBe(1);
        expect(console.error).toHaveBeenCalled();
    });

    it('answers hello with welcome and broadcasts userStatusUpdate to all', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });

        expect(ctx.posted.slice(2)).toEqual([
            { type: 'welcome', tabId: 't1' },
            {
                type: 'event',
                to: 'all',
                event: SocketEvents.USER_STATUS_UPDATE,
                payload: [
                    ...BOTS_ONLINE,
                    { userId: alice.id, status: 'online', isTyping: false },
                ] satisfies ConnectedUser[],
            },
        ]);
        expect([...ctx.watchers.keys()]).toEqual(['t1']);

        // A second hello from the same tab is welcomed but not watched again.
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });
        expect(ctx.posted.at(-1)).toEqual({ type: 'welcome', tabId: 't1' });
        expect(statusEvents(ctx.posted)).toHaveLength(1);
        expect(ctx.watchers.size).toBe(1);
    });

    it('a request from a tab that never said hello with a user is answered 401', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: null });
        await server.handle(request('t1', { op: 'sync' }));
        await server.handle(request('t2', { op: 'sync' }));

        const responses = ctx.posted.filter((m) => m.type === 'response');
        expect(responses).toHaveLength(2);
        for (const response of responses) {
            expect(response).toMatchObject({
                ok: false,
                error: { status: 401, message: 'Not signed in' },
            });
        }
        expect(responses.map((r) => r.tabId)).toEqual(['t1', 't2']);
    });

    it('takes the user from the hello, not from the request', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: bruno.id });
        await server.handle(request('t1', createMessage('hi')));

        const sync = await syncOf(ctx, server, 't1');
        const general = sync.channels.find((c) => c.id === channelId);
        expect(general?.messages.at(-1)).toMatchObject({
            content: 'hi',
            authorId: bruno.id,
        });
    });

    it('a createMessage saves before it posts', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });
        ctx.order.length = 0;

        await server.handle(request('t1', createMessage('hello')));

        expect(ctx.order).toEqual(['save', 'response', 'event']);
        expect(lastResponse(ctx.posted)).toMatchObject({
            tabId: 't1',
            ok: true,
            result: { id: expect.any(String) },
        });
        expect(ctx.posted.at(-1)).toMatchObject({
            type: 'event',
            event: SocketEvents.MESSAGE_CREATE,
            payload: { content: 'hello', authorId: alice.id },
        });
    });

    it('a rule error becomes a response with ok false, its message and status, and nothing is saved', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });
        const saves = ctx.store.saves;

        await server.handle(request('t1', createMessage('x'.repeat(2001))));

        expect(lastResponse(ctx.posted)).toMatchObject({
            ok: false,
            error: { status: 400, message: expect.any(String) },
        });
        expect(ctx.store.saves).toBe(saves);
    });

    it('an unexpected error becomes a response with ok false and status 500, and nothing is saved', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });
        const saves = ctx.store.saves;

        await server.handle(
            request('t1', {
                op: 'createMessage',
                guildId,
                channelId,
            } as unknown as LocalRequest),
        );

        expect(lastResponse(ctx.posted)).toMatchObject({
            tabId: 't1',
            ok: false,
            error: { status: 500, message: expect.any(String) },
        });
        expect(ctx.store.saves).toBe(saves);
    });

    it('keeps serving when saving fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });
        ctx.store.failSave = true;

        await server.handle(request('t1', createMessage('kept')));
        expect(lastResponse(ctx.posted)).toMatchObject({ ok: true });

        const sync = await syncOf(ctx, server, 't1');
        const general = sync.channels.find((c) => c.id === channelId);
        expect(general?.messages.at(-1)?.content).toBe('kept');
    });

    it('a read (sync) does not save', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });
        const saves = ctx.store.saves;

        const sync = await syncOf(ctx, server, 't1');

        expect(sync.connectedUsers).toEqual([
            ...BOTS_ONLINE,
            { userId: alice.id, status: 'online', isTyping: false },
        ]);
        expect(ctx.store.saves).toBe(saves);
    });

    it('requests are applied in arrival order', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });

        const first = server.handle(request('t1', createMessage('first')));
        const second = server.handle(request('t1', createMessage('second')));
        await Promise.all([first, second]);

        const sync = await syncOf(ctx, server, 't1');
        const general = sync.channels.find((c) => c.id === channelId);
        expect(general?.messages.slice(-2).map((m) => m.content)).toEqual([
            'first',
            'second',
        ]);
    });

    it('status updates are broadcast, invalid ones are not', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });

        await server.handle({
            type: 'status',
            tabId: 't1',
            update: { status: 'dnd' },
        });
        await server.handle({
            type: 'status',
            tabId: 't1',
            update: { status: 'nope' },
        });

        const events = statusEvents(ctx.posted);
        expect(events).toHaveLength(2);
        expect(events[1]).toMatchObject({
            to: 'all',
            payload: [...BOTS_ONLINE, { userId: alice.id, status: 'dnd' }],
        });
    });

    it('a tab that goes away takes its user offline', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });
        await server.handle({ type: 'hello', tabId: 't2', userId: bruno.id });

        ctx.watchers.get('t1')?.();
        await server.handle(request('t2', { op: 'sync' }));

        expect(statusEvents(ctx.posted).at(-1)).toEqual({
            type: 'event',
            to: 'all',
            event: SocketEvents.USER_STATUS_UPDATE,
            payload: [
                ...BOTS_ONLINE,
                { userId: bruno.id, status: 'online', isTyping: false },
            ],
        });
    });

    it('reset clears the store, seeds again, forgets presence and posts reset', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });
        await server.handle(request('t1', createMessage('gone soon')));
        ctx.order.length = 0;

        const reset = request('t1', { op: 'reset' });
        await server.handle(reset);

        expect(ctx.store.clears).toBe(1);
        expect(ctx.store.state?.messages).toHaveLength(seed.messages.length);
        expect(ctx.order).toEqual(['save', 'response', 'reset']);
        expect(lastResponse(ctx.posted)).toMatchObject({
            tabId: 't1',
            requestId: reset.requestId,
            ok: true,
        });

        // Presence is forgotten: the tab must say hello again.
        await server.handle(request('t1', { op: 'sync' }));
        expect(lastResponse(ctx.posted)).toMatchObject({
            ok: false,
            error: { status: 401 },
        });
    });

    it('adds the bots to a snapshot without them and saves it', async () => {
        const ctx = await setup();
        await ctx.start();

        expect(ctx.store.saves).toBe(1);
        expect(ctx.store.state).toEqual(ensureBots(seed));
    });

    it('the reply is posted as a message from the bot and reaches the guild members', async () => {
        const ctx = await setup();
        ctx.generate.mockResolvedValueOnce({ text: 'Hola!', truncated: false });
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });

        await server.handle(request('t1', createMessage('hola pedro')));

        await vi.waitFor(() => {
            expect(ctx.posted.at(-1)).toMatchObject({
                type: 'event',
                event: SocketEvents.USER_STATUS_UPDATE,
            });
            expect(
                ctx.posted.filter(
                    (m) =>
                        m.type === 'event' &&
                        m.event === SocketEvents.MESSAGE_CREATE,
                ),
            ).toHaveLength(2);
        });
        const index = ctx.posted.findLastIndex(
            (m) =>
                m.type === 'event' && m.event === SocketEvents.MESSAGE_CREATE,
        );
        const event = ctx.posted[index];
        expect(event).toMatchObject({
            to: expect.arrayContaining([alice.id, bruno.id, pedro.user.id]),
            payload: { content: 'Hola!', authorId: pedro.user.id, channelId },
        });
        const message = (event as { payload: Message }).payload;
        expect(ctx.savedAtPost[index]?.messages).toContainEqual(message);

        // The bot typed while it generated, and stopped after posting.
        const typing = statusEvents(ctx.posted).map(
            (m) =>
                (m as { payload: ConnectedUser[] }).payload.find(
                    (u) => u.userId === pedro.user.id,
                )?.isTyping,
        );
        expect(typing.slice(-2)).toEqual([true, false]);
        expect(ctx.posted.indexOf(statusEvents(ctx.posted).at(-1)!)).toBe(
            index + 1,
        );
    });

    it("a bot's own message never triggers a bot", async () => {
        const ctx = await setup();
        ctx.generate.mockResolvedValueOnce({
            text: 'Chayanne y pedro, hola.',
            truncated: false,
        });
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });

        await server.handle(request('t1', createMessage('pedro')));
        await vi.waitFor(() => {
            expect(ctx.store.state?.messages.at(-1)?.authorId).toBe(
                pedro.user.id,
            );
        });
        await server.handle(request('t1', { op: 'sync' }));
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(ctx.generate).toHaveBeenCalledTimes(1);
    });

    it('gives a snapshot without bot settings the defaults and saves it', async () => {
        const { botSettings: _, ...withoutSettings } = ensureBots(seed);
        const ctx = await setup(withoutSettings as LocalState);
        await ctx.start();

        expect(ctx.store.saves).toBe(1);
        expect(ctx.store.state?.botSettings).toEqual(DEFAULT_BOT_SETTINGS);
    });

    it('getBotSettings is a read and updateBotSettings saves before it responds', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });
        const saves = ctx.store.saves;

        await server.handle(request('t1', { op: 'getBotSettings' }));
        expect(lastResponse(ctx.posted)).toMatchObject({
            ok: true,
            result: DEFAULT_BOT_SETTINGS,
        });
        expect(ctx.store.saves).toBe(saves);

        ctx.order.length = 0;
        await server.handle(
            request('t1', {
                op: 'updateBotSettings',
                settings: { historyLimit: 4 },
            }),
        );
        const updated = { ...DEFAULT_BOT_SETTINGS, historyLimit: 4 };
        expect(ctx.order).toEqual(['save', 'response']);
        expect(lastResponse(ctx.posted)).toMatchObject({
            ok: true,
            result: updated,
        });
        expect(ctx.store.state?.botSettings).toEqual(updated);
    });

    it('the bots generate with the stored settings', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });
        await server.handle(
            request('t1', {
                op: 'updateBotSettings',
                settings: { temperature: 0.7, maxNewTokens: 64 },
            }),
        );

        await server.handle(request('t1', createMessage('pedro')));

        await vi.waitFor(() => {
            expect(ctx.generate).toHaveBeenCalledWith(
                expect.objectContaining({ temperature: 0.7, maxNewTokens: 64 }),
            );
        });
    });

    it('reset restores the default bot settings', async () => {
        const ctx = await setup();
        const server = await ctx.start();
        await server.handle({ type: 'hello', tabId: 't1', userId: alice.id });
        await server.handle(
            request('t1', {
                op: 'updateBotSettings',
                settings: { disabledBotIds: [pedro.user.id] },
            }),
        );

        await server.handle(request('t1', { op: 'reset' }));

        expect(ctx.store.state?.botSettings).toEqual(DEFAULT_BOT_SETTINGS);
    });
});
