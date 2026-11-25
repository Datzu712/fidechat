import {
    MODEL_CHANNEL_NAME,
    type ModelMessage,
} from '@/shared/backend/local/model/model-protocol';
import {
    CHANNEL_NAME,
    REQUEST_TIMEOUT_MS,
    type ServerMessage,
    type TabMessage,
    tabLockName,
} from '@/shared/backend/local/protocol';
import { requestMaster } from '@/shared/backend/local/tab/master';
import { receiveModel } from '@/shared/backend/local/tab/replica/model-link';
import { receive } from '@/shared/backend/local/tab/replica/server-link';
import { hello } from '@/shared/backend/local/tab/replica/session';
import {
    createRequester,
    type Requester,
} from '@/shared/backend/local/tab/requester';

// Every tab's side of the local backend: `getTab` starts the tab and wires its
// links to the server (`server-link.ts`) and to the model (`model-link.ts`).

// The tab's state, shared by the local backend's pieces: its channels to the
// server and to the model worker, its locks, and what it learned from them.
// Every tab is a replica, the master included; `master.ts` adds the elected
// tab's workers.
export interface Tab {
    tabId: string;
    post(message: TabMessage): void;
    postModel(message: ModelMessage): void;
    requester: Requester;
}

/**
 * Starts the tab on first use: its channel, its own lock and, once that lock
 * is held, the first hello and the bid for the master lock. Until then every
 * message waits, so the server never sees the tab before its lock exists.
 */
export function getTab(): Tab {
    if (tab) return tab;

    const tabId = crypto.randomUUID();
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const lockHeld = holdTabLock(tabId);
    // Registered first, so it runs before any message posted later.
    void lockHeld.then(() => {
        channel.postMessage(hello(tabId));
        requestMaster();
    });

    const post = (message: TabMessage) => {
        void lockHeld.then(() => channel.postMessage(message));
    };
    const modelChannel = new BroadcastChannel(MODEL_CHANNEL_NAME);
    const created: Tab = {
        tabId,
        post,
        postModel: (message) => modelChannel.postMessage(message),
        requester: createRequester({
            tabId,
            post,
            hello: () => hello(tabId),
            timeoutMs: REQUEST_TIMEOUT_MS,
        }),
    };
    channel.onmessage = (event: MessageEvent<ServerMessage>) => {
        receive(created, event.data);
    };
    modelChannel.onmessage = (event: MessageEvent<ModelMessage>) => {
        receiveModel(created, event.data);
    };
    // Learn the model's state from the master's worker, if it runs yet.
    created.postModel({ type: 'who' });

    tab = created;
    return created;
}

/** Requests the tab's own lock; resolves once it is held. */
function holdTabLock(tabId: string) {
    return new Promise<void>((resolve) => {
        void navigator.locks.request(tabLockName(tabId), () => {
            resolve();
            // Held while this promise is pending, which is never: the lock lives as long
            // as the tab.
            return new Promise<never>(() => {});
        });
    });
}

let tab: Tab | undefined;
