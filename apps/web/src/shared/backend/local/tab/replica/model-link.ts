import type {
    ModelMessage,
    ModelState,
} from '@/shared/backend/local/model/model-protocol';
import {
    setStoredModelId,
    storedModelId,
} from '@/shared/backend/local/tab/replica/session';
import type { Tab } from '@/shared/backend/local/tab/replica/worker';

// The tab's link to the model worker: the model's state as the master's
// worker reports it, and the rule that restores the model after a reload.

/**
 * The tab stores the model it last saw loading or ready. A new model worker
 * (its master closed or reloaded; a reset reloads every tab) marks its first
 * state `boot`: the tab then asks it to load the stored model again, from the
 * browser cache only, and keeps the stored id. Any other `off` (a clear) or
 * an error forgets the model, so a clear never restores it and a failed model
 * is not retried on every reload. A tab that never saw a model stores
 * nothing, so a fresh visit starts with the bots off.
 */
export function receiveModel(current: Tab, message: ModelMessage) {
    if (message.type !== 'state') return;
    modelState = message.state;
    const storedId = storedModelId();
    if (message.boot) {
        if (storedId !== null)
            current.postModel({
                type: 'load',
                modelId: storedId,
                restore: true,
            });
    } else if (
        modelState.status === 'loading' ||
        modelState.status === 'ready'
    ) {
        setStoredModelId(modelState.modelId);
    } else if (modelState.status === 'off' || modelState.status === 'error') {
        setStoredModelId(null);
    }
    modelListeners.forEach((listener) => listener(modelState));
}

export function currentModelState() {
    return modelState;
}

/** Returns the unsubscribe function. */
export function onModelStateChange(listener: (state: ModelState) => void) {
    modelListeners.add(listener);
    return () => {
        modelListeners.delete(listener);
    };
}

let modelState: ModelState = { status: 'off' };
const modelListeners = new Set<(state: ModelState) => void>();
