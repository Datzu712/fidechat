import type { ServerMessage } from '@/shared/backend/local/protocol';
import type { LogLevel } from '@/shared/backend/local/server/logs/format';
import type { Logger } from '@/shared/backend/local/server/logs/logger';
import { type Route, routeOf } from '@/shared/backend/local/server/logs/routes';
import type { RequestMessage } from '@/shared/backend/local/server/requests';

// pino-http's `request completed` line: one per request, logged when its
// response is posted, with the time in between.

type ResponseMessage = Extract<ServerMessage, { type: 'response' }>;

export interface HttpLogs {
    request(message: RequestMessage): void;
    response(message: ResponseMessage): void;
}

export function createHttpLogs({
    logger,
    clock,
    userAgent,
}: {
    logger: Logger;
    clock(): number;
    userAgent: string;
}): HttpLogs {
    const pending = new Map<
        string,
        { id: string; route: Route; start: number }
    >();
    let count = 0;

    const request = (message: RequestMessage) => {
        count += 1;
        pending.set(message.requestId, {
            // Fastify's request ids.
            id: `req-${count.toString(36)}`,
            route: routeOf(message.request),
            start: clock(),
        });
    };

    const response = (message: ResponseMessage) => {
        const request = pending.get(message.requestId);
        if (!request) return;
        pending.delete(message.requestId);

        const { id, route, start } = request;
        const statusCode = message.ok ? route.status : message.error.status;
        const level = levelOf(statusCode);
        const text =
            level === 'error' ? 'request errored' : 'request completed';
        logger.line(level, text, {
            req: {
                id,
                method: route.method,
                url: route.url,
                remoteAddress: '127.0.0.1',
                userAgent,
            },
            res: { statusCode },
            responseTime: Math.round(clock() - start),
        });
    };

    return { request, response };
}

/** The api's `customLogLevel`. */
function levelOf(statusCode: number): LogLevel {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'info';
}
