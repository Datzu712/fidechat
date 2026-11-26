import type { TabMessage } from '@/shared/backend/local/protocol';
import { getTab } from '@/shared/backend/local/tab/replica/worker';

// The tab's sessionStorage: its user, which the hello tells the server, and
// the model it last saw loading or ready.

export function storedUserId(): string | null {
    return sessionStorage.getItem(SESSION_KEY);
}

/** Stores the tab's user, or forgets it, and tells the server. */
export function setStoredUser(userId: string | null) {
    if (userId === null) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, userId);
    const current = getTab();
    current.post(hello(current.tabId));
}

export function leave() {
    setStoredUser(null);
    window.location.href = '/login';
}

export function hello(tabId: string): TabMessage {
    return { type: 'hello', tabId, userId: storedUserId() };
}

export function storedModelId(): string | null {
    return sessionStorage.getItem(MODEL_SESSION_KEY);
}

/** Stores the model this tab saw loading or ready, or forgets it. */
export function setStoredModelId(modelId: string | null) {
    if (modelId === null) sessionStorage.removeItem(MODEL_SESSION_KEY);
    else sessionStorage.setItem(MODEL_SESSION_KEY, modelId);
}

/** The sessionStorage key holding the tab's user id. */
const SESSION_KEY = 'fidechat-local-user';
/** The sessionStorage key holding the model this tab last saw loading or ready. */
const MODEL_SESSION_KEY = 'fidechat-local-model';
