// One console line shaped like pino-pretty's single-line output:
// `[HH:MM:ss.SSS] LEVEL (pid): message {json}`, colored with `%c`.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_COLORS: Record<LogLevel, string> = {
    debug: '#60a5fa',
    info: '#4ade80',
    warn: '#facc15',
    error: '#f87171',
};
const GRAY = 'color: #9ca3af';
const CYAN = 'color: #22d3ee';

/** The `console.log` arguments for one line: `%c` markers, then their CSS. */
export function formatLog({
    time,
    level,
    pid,
    message,
    fields,
}: {
    time: Date;
    level: LogLevel;
    pid: number;
    message: string;
    fields: Record<string, unknown>;
}): unknown[] {
    const stamp = time.toISOString().slice(11, 23);
    const label = level.toUpperCase();
    const json = Object.keys(fields).length ? ` ${stringify(fields)}` : '';
    return [
        `%c[${stamp}] %c${label}%c (${pid}): %c${message}%c${json}`,
        GRAY,
        `color: ${LEVEL_COLORS[level]}; font-weight: bold`,
        '',
        CYAN,
        GRAY,
    ];
}

/** JSON, or a marker when the value cannot be serialized (a cycle). */
export function stringify(value: unknown): string {
    try {
        return JSON.stringify(value);
    } catch {
        return '[unserializable]';
    }
}
