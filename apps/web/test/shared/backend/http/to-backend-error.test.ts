import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

import { BackendError } from '@/shared/backend/backend';
import { toBackendError } from '@/shared/backend/http/to-backend-error';

describe('toBackendError', () => {
    it('uses the api message and status', () => {
        const axiosError = new AxiosError(
            'Request failed',
            'ERR',
            undefined,
            undefined,
            {
                status: 403,
                data: { message: 'Not a member of this guild' },
            } as AxiosResponse,
        );
        const error = toBackendError(axiosError);
        expect(error).toBeInstanceOf(BackendError);
        expect(error.message).toBe('Not a member of this guild');
        expect(error.status).toBe(403);
    });

    it('falls back to the axios message without a response', () =>
        expect(toBackendError(new AxiosError('Network Error')).message).toBe(
            'Network Error',
        ));

    it('wraps anything else', () =>
        expect(toBackendError('boom').message).toBe(
            'Something went wrong. Please try again.',
        ));
});
