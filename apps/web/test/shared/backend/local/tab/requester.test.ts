import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BackendError } from '@/shared/backend/backend';
import type {
    ServerMessage,
    TabMessage,
} from '@/shared/backend/local/protocol';
import { createRequester } from '@/shared/backend/local/tab/requester';

const TAB_ID = 'tab-1';
const HELLO: TabMessage = { type: 'hello', tabId: TAB_ID, userId: 'user-1' };

function setup() {
    const posted: TabMessage[] = [];
    const requester = createRequester({
        tabId: TAB_ID,
        post: (message) => posted.push(message),
        hello: () => HELLO,
        timeoutMs: 5000,
    });
    /** The id of the last request the requester posted. */
    const lastRequestId = () => {
        const last = posted.at(-1);
        if (last?.type !== 'request') throw new Error('No request posted');
        return last.requestId;
    };
    return { posted, requester, lastRequestId };
}

function okResponse(
    requestId: string,
    result: unknown,
): Extract<ServerMessage, { ok: true }> {
    return { type: 'response', tabId: TAB_ID, requestId, ok: true, result };
}

describe('createRequester', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('resolves with the result of the matching response', async () => {
        const { posted, requester, lastRequestId } = setup();

        const result = requester.request<string[]>({ op: 'sync' });
        expect(posted).toEqual([
            {
                type: 'request',
                tabId: TAB_ID,
                requestId: lastRequestId(),
                request: { op: 'sync' },
            },
        ]);
        requester.settle(okResponse(lastRequestId(), ['a']));

        await expect(result).resolves.toEqual(['a']);
    });

    it('rejects with a BackendError carrying the message and status of a failed response', async () => {
        const { requester, lastRequestId } = setup();

        const result = requester.request({ op: 'getPublicGuilds' });
        requester.settle({
            type: 'response',
            tabId: TAB_ID,
            requestId: lastRequestId(),
            ok: false,
            error: { message: 'Not signed in', status: 401 },
        });

        const error: unknown = await result.catch((e: unknown) => e);
        expect(error).toBeInstanceOf(BackendError);
        expect(error).toMatchObject({ message: 'Not signed in', status: 401 });
    });

    it('ignores a response for another tab or another request', async () => {
        const { requester, lastRequestId } = setup();
        const onSettled = vi.fn();

        void requester.request({ op: 'sync' }).then(onSettled, onSettled);
        const requestId = lastRequestId();
        requester.settle({ ...okResponse(requestId, 1), tabId: 'tab-2' });
        requester.settle(okResponse(`${requestId}-other`, 2));
        await vi.advanceTimersByTimeAsync(0);

        expect(onSettled).not.toHaveBeenCalled();
    });

    it('rejects after the timeout', async () => {
        const { requester, lastRequestId } = setup();

        const result = requester.request({ op: 'sync' });
        const error = result.catch((e: unknown) => e);
        await vi.advanceTimersByTimeAsync(4999);
        requester.settle(okResponse('unknown', null));
        await vi.advanceTimersByTimeAsync(1);

        await expect(error).resolves.toBeInstanceOf(BackendError);
        await expect(error).resolves.toMatchObject({
            message: 'The local server did not answer',
            status: 503,
        });
        // A late response must not throw nor settle anything.
        expect(() =>
            requester.settle(okResponse(lastRequestId(), 'late')),
        ).not.toThrow();
        await expect(error).resolves.toBeInstanceOf(BackendError);
    });

    it('resends hello when a server announces itself', () => {
        const { posted, requester, lastRequestId } = setup();

        void requester.request({ op: 'me' });
        const pendingId = lastRequestId();
        void requester.request({ op: 'sync' });
        requester.settle(okResponse(lastRequestId(), null));
        posted.length = 0;

        requester.serverReady();

        expect(posted).toEqual([
            HELLO,
            {
                type: 'request',
                tabId: TAB_ID,
                requestId: pendingId,
                request: { op: 'me' },
            },
        ]);
    });
});
