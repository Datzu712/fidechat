import { AxiosError } from 'axios';

import { errorMessage } from '@/shared/api/error-message';
import { BackendError } from '@/shared/backend/backend';

/** Converts a failed api call: the api's own message when it sent one. */
export function toBackendError(error: unknown): BackendError {
    if (error instanceof AxiosError) {
        return new BackendError(
            error.response?.data?.message || error.message,
            error.response?.status,
        );
    }

    return new BackendError(errorMessage(error));
}
