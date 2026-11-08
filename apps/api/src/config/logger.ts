import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';

const isProduction = process.env.NODE_ENV === 'production';

/** OAuth parameters in the login callback URL (`code`, `state`, `session_state`) are never logged. */
function redactUrl(url: string): string {
    return url.replace(/([?&](?:code|state|session_state)=)[^&]*/g, '$1[REDACTED]');
}

// Logs go to stdout: JSON in production, pino-pretty elsewhere (a dev dependency, so never loaded in the image).
export const loggerParams: Params = {
    pinoHttp: {
        level: isProduction ? 'info' : 'debug',
        transport: isProduction ? undefined : { target: 'pino-pretty', options: { singleLine: true } },
        customLogLevel: (_req, res, err) => {
            if (err || res.statusCode >= 500) return 'error';
            if (res.statusCode >= 400) return 'warn';
            return 'info';
        },
        // Only what is needed to trace a request: headers (cookie, authorization, set-cookie) and bodies are
        // left out, so no credentials or message contents reach the logs. middie copies Fastify's `ip`, which
        // honours TRUST_PROXY, onto the raw request.
        serializers: {
            req: (req: { id: string; method: string; url: string; raw: IncomingMessage & { ip?: string } }) => ({
                id: req.id,
                method: req.method,
                url: redactUrl(req.url),
                remoteAddress: req.raw.ip,
                userAgent: req.raw.headers['user-agent'],
            }),
            res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
        },
    },
};
