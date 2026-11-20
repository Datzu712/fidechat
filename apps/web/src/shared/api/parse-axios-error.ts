import { AxiosError } from 'axios';

/** A message for the user: the API's own message when it sent one. */
export function parseAxiosError(error: unknown): string {
    if (error instanceof AxiosError) {
        return error.response?.data.message || error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Something went wrong. Please try again.';
}
