import type { Generated } from '@/shared/backend/local/model/model-protocol';
import type {
    ServerMessage,
    TabMessage,
} from '@/shared/backend/local/protocol';
import { logBoot, logStarted } from '@/shared/backend/local/server/logs/boot';
import { createGatewayLogs } from '@/shared/backend/local/server/logs/gateway';
import { createHttpLogs } from '@/shared/backend/local/server/logs/http';
import {
    type ContextLogger,
    createLogger,
} from '@/shared/backend/local/server/logs/logger';
import type {
    LocalServer,
    ServerDeps,
} from '@/shared/backend/local/server/server';

// The local server's console logs, shaped like the api's pino-pretty output
// so the master tab looks like it runs a real server: liveness, not an exact
// copy. They are read off the messages the server receives and posts.

interface ServerLogsDeps {
    print(...args: unknown[]): void;
    /** The time printed on each line. */
    now(): Date;
    /** Milliseconds, for durations. */
    clock(): number;
    /** Random per boot, so a new master looks like a new process. */
    pid: number;
    origin: string;
    userAgent: string;
}

export interface ServerLogs {
    /** Logs the startup block, before the state loads. */
    boot(): void;
    /** Wraps `post`, `watchTab` and `generate`; the rest is left as is. */
    wrapDeps(inner: ServerDeps): ServerDeps;
    wrapServer(inner: LocalServer): LocalServer;
}

export function createServerLogs(deps: ServerLogsDeps): ServerLogs {
    const logger = createLogger(deps);
    const gateway = createGatewayLogs(logger);
    const http = createHttpLogs({
        logger,
        clock: deps.clock,
        userAgent: deps.userAgent,
    });
    const ai = logger.context('AIService');

    const received = (message: TabMessage) => {
        switch (message.type) {
            case 'hello':
                return gateway.hello(message.tabId, message.userId);
            case 'status':
                return gateway.status(message.tabId, message.update);
            case 'request':
                return http.request(message);
        }
    };

    const posted = (message: ServerMessage) => {
        switch (message.type) {
            case 'ready':
                return logStarted(logger, deps.origin);
            case 'response':
                return http.response(message);
            case 'event':
                return gateway.emitted(message);
            case 'reset':
                return logger
                    .context('DemoController')
                    .info('Demo state reset to the seed');
        }
    };

    return {
        boot: () => safely(() => logBoot(logger)),
        wrapDeps: (inner) => ({
            ...inner,
            post(message) {
                safely(() => posted(message));
                inner.post(message);
            },
            watchTab(tabId, onGone) {
                inner.watchTab(tabId, () => {
                    safely(() => gateway.gone(tabId));
                    onGone();
                });
            },
            async generate(input) {
                const start = deps.clock();
                const result = await inner.generate(input);
                const ms = Math.round(deps.clock() - start);
                safely(() => logReply(ai, result, ms));
                return result;
            },
        }),
        wrapServer: (inner) => ({
            handle(message) {
                safely(() => received(message));
                return inner.handle(message);
            },
        }),
    };
}

function logReply(ai: ContextLogger, result: Generated | null, ms: number) {
    if (!result) {
        ai.warn('No local model is ready: the bot stays silent');
        return;
    }
    const chars = result.text.length;
    if (result.truncated) {
        ai.warn(`Reply finished with length (${chars} chars)`);
    } else {
        ai.debug(`Reply generated in ${ms} ms (${chars} chars)`);
    }
}

/** Logging is best effort: a failed log never stops the server. */
function safely(log: () => void): void {
    try {
        log();
    } catch {
        // Dropped on purpose.
    }
}
