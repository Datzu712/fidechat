import {
    formatLog,
    type LogLevel,
} from '@/shared/backend/local/server/logs/format';

/** A Nest `Logger`: each line carries `{"context":"<name>"}`. */
export type ContextLogger = Record<LogLevel, (message: string) => void>;

export interface Logger {
    /** A line with its own fields, like pino-http's request lines. */
    line(
        level: LogLevel,
        message: string,
        fields: Record<string, unknown>,
    ): void;
    context(name: string): ContextLogger;
}

export function createLogger({
    print,
    now,
    pid,
}: {
    print(...args: unknown[]): void;
    now(): Date;
    pid: number;
}): Logger {
    const line: Logger['line'] = (level, message, fields) => {
        print(...formatLog({ time: now(), level, pid, message, fields }));
    };

    const context = (name: string): ContextLogger => {
        const at = (level: LogLevel) => (message: string) =>
            line(level, message, { context: name });
        return {
            debug: at('debug'),
            info: at('info'),
            warn: at('warn'),
            error: at('error'),
        };
    };

    return { line, context };
}
