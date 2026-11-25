/** Runs the local server in the master tab's dedicated worker. */
import {
    type GenerateInput,
    type Generated,
    MODEL_CHANNEL_NAME,
    type ModelMessage,
} from '@/shared/backend/local/model/model-protocol';
import {
    CHANNEL_NAME,
    type TabMessage,
    tabLockName,
} from '@/shared/backend/local/protocol';
import { snapshotStore } from '@/shared/backend/local/server/data/store';
import { createServer } from '@/shared/backend/local/server/server';

const channel = new BroadcastChannel(CHANNEL_NAME);

/**
 * A reply takes seconds on WebGPU. Past this the model worker is taken for
 * dead and the bot stays silent, so the bot queue never hangs.
 */
const GENERATE_TIMEOUT_MS = 60_000;
const modelChannel = new BroadcastChannel(MODEL_CHANNEL_NAME);
const pending = new Map<string, (result: Generated | null) => void>();

modelChannel.onmessage = (event: MessageEvent<ModelMessage>) => {
    const message = event.data;
    if (message.type !== 'generated') return;
    pending.get(message.requestId)?.(message.result);
};

/** Asks the master's model worker; resolves null when no model is ready. */
function generate(input: GenerateInput): Promise<Generated | null> {
    const requestId = crypto.randomUUID();
    return new Promise((resolve) => {
        const settle = (result: Generated | null) => {
            clearTimeout(timer);
            pending.delete(requestId);
            resolve(result);
        };
        const timer = setTimeout(() => settle(null), GENERATE_TIMEOUT_MS);
        pending.set(requestId, settle);
        const message: ModelMessage = { type: 'generate', requestId, ...input };
        modelChannel.postMessage(message);
    });
}

const server = await createServer({
    post: (message) => channel.postMessage(message),
    store: snapshotStore,
    watchTab(tabId, onGone) {
        // Granted only once the tab, which holds this lock while open, is gone.
        void navigator.locks.request(tabLockName(tabId), () => onGone());
    },
    newId: () => crypto.randomUUID(),
    now: () => new Date(),
    generate,
});

// Messages that arrive while the state loads are dropped, not queued: on
// `ready` every tab resends its hello and pending requests, so queueing them
// would apply a write twice.
channel.onmessage = (event: MessageEvent<TabMessage>) => {
    void server.handle(event.data);
};
