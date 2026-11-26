/** A message for the user: the error's own message when it has one. */
export function errorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return 'Something went wrong. Please try again.';
}
