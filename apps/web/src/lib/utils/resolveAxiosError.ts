import { AxiosError } from 'axios';

export function parseAxiosError(
    error: Error | AxiosError | unknown,
    defaultStr?: string,
): string {
    if (error instanceof AxiosError) {
        return error.response?.data.message || error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return defaultStr || 'Something went wrong. Please try again.';
}
