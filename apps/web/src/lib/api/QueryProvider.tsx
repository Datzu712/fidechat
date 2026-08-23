'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 5, // 5 minutos
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        retry: (failureCount, error: any) => {
                            if (error?.response?.status === 401) return false;
                            if (error?.response?.status === 403) return false;
                            if (error?.response?.status === 404) return false;

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
