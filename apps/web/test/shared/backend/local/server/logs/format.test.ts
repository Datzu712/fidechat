import { describe, expect, it } from 'vitest';

import { formatLog } from '@/shared/backend/local/server/logs/format';

/** The console line as printed, without the `%c` style markers. */
const plain = (args: unknown[]) => (args[0] as string).replaceAll('%c', '');

describe('formatLog', () => {
    it('formats a line like pino-pretty', () => {
        const args = formatLog({
            time: new Date('2026-11-26T09:05:03.007Z'),
            level: 'info',
            pid: 4242,
            message: 'Starting Nest application...',
            fields: { context: 'NestFactory' },
        });

        expect(plain(args)).toBe(
            '[09:05:03.007] INFO (4242): Starting Nest application... {"context":"NestFactory"}',
        );
        // One CSS string per %c marker.
        expect(args.length - 1).toBe(
            (args[0] as string).split('%c').length - 1,
        );
    });

    it('omits the json when there are no fields', () => {
        const args = formatLog({
            time: new Date('2026-11-26T09:05:03.007Z'),
            level: 'warn',
            pid: 4242,
            message: 'hi',
            fields: {},
        });

        expect(plain(args)).toBe('[09:05:03.007] WARN (4242): hi');
    });

    it('prints unserializable fields as a marker', () => {
        const cyclic: Record<string, unknown> = {};
        cyclic.self = cyclic;
        const args = formatLog({
            time: new Date('2026-11-26T09:05:03.007Z'),
            level: 'debug',
            pid: 1,
            message: 'x',
            fields: cyclic,
        });

        expect(plain(args)).toBe(
            '[09:05:03.007] DEBUG (1): x [unserializable]',
        );
    });
});
