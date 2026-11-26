import { describe, expect, it } from 'vitest';

import { errorMessage } from '@/shared/api/error-message';
import { BackendError } from '@/shared/backend/backend';

describe('errorMessage', () => {
    it('reads a BackendError', () =>
        expect(errorMessage(new BackendError('Nope', 403))).toBe('Nope'));

    it('has a default', () =>
        expect(errorMessage(undefined)).toBe(
            'Something went wrong. Please try again.',
        ));
});
