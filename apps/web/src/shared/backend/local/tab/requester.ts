import { BackendError } from '@/shared/backend/backend';
import type {
    LocalRequest,
    ServerMessage,
    TabMessage,
} from '@/shared/backend/local/protocol';

export interface Requester {
    request<T>(request: LocalRequest): Promise<T>;
    settle(message: ServerMessage): void;
    /** Call when a server says ready: sends hello again, then everything still unanswered. */
    serverReady(): void;
}

interface Pending {
    message: TabMessage;
    resolve(result: unknown): void;
    reject(error: BackendError): void;
    timer: ReturnType<typeof setTimeout>;
}

/** Matches the tab's requests to the server's responses. */
export function createRequester(input: {
    tabId: string;
    post(message: TabMessage): void;
    hello(): TabMessage;
    timeoutMs: number;
}): Requester {
    const pending = new Map<string, Pending>();
    let nextId = 0;

    return {
        request<T>(request: LocalRequest) {
            const requestId = String(nextId++);
            const message: TabMessage = {
                type: 'request',
                tabId: input.tabId,
                requestId,
                request,
            };
            return new Promise<T>((resolve, reject) => {
                const timer = setTimeout(() => {
                    pending.delete(requestId);
                    reject(
                        new BackendError(
                            'The local server did not answer',
                            503,
                        ),
                    );
                }, input.timeoutMs);
                pending.set(requestId, {
                    message,
                    resolve: (result) => resolve(result as T),
                    reject,
                    timer,
                });
                input.post(message);
            });
        },

        settle(message) {
            if (message.type !== 'response' || message.tabId !== input.tabId) {
                return;
            }
            const entry = pending.get(message.requestId);
            if (!entry) return;
            pending.delete(message.requestId);
            clearTimeout(entry.timer);
            if (message.ok) entry.resolve(message.result);
            else {
                entry.reject(
                    new BackendError(
                        message.error.message,
                        message.error.status,
                    ),
                );
            }
        },

        serverReady() {
            input.post(input.hello());
            for (const entry of pending.values()) input.post(entry.message);
        },
    };
}
