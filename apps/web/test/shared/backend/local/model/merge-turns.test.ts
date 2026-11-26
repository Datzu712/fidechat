import { describe, expect, it } from 'vitest';

import { mergeTurns } from '@/shared/backend/local/model/merge-turns';

describe('mergeTurns', () => {
    it('joins consecutive messages of the same role', () => {
        expect(
            mergeTurns([
                { role: 'system', content: 'persona' },
                { role: 'user', content: 'Ana: hola' },
                { role: 'user', content: 'Luis: qué tal' },
                { role: 'assistant', content: 'bien' },
                { role: 'user', content: 'Ana: genial' },
            ]),
        ).toEqual([
            { role: 'system', content: 'persona' },
            { role: 'user', content: 'Ana: hola\nLuis: qué tal' },
            { role: 'assistant', content: 'bien' },
            { role: 'user', content: 'Ana: genial' },
        ]);
    });

    it('keeps alternating messages as they are', () => {
        const messages = [
            { role: 'system', content: 'persona' },
            { role: 'user', content: 'Ana: hola' },
        ] as const;
        expect(mergeTurns([...messages])).toEqual(messages);
    });
});
