import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

import { BackendError } from '@/shared/backend/backend';

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 5,
                        // Client errors will not change on a retry.
                        retry: (failureCount, error) => {
                            const status =
                                error instanceof BackendError
                                    ? error.status
                                    : undefined;
                            if (status === 401 || status === 403) return false;
                            if (status === 404) return false;

                            return failureCount < 3;
                        },
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
