'use client';

import { ReactNode, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '@/contexts/providers/SocketProvider';

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <SessionProvider refetchInterval={60}>
                <SocketProvider>{children}</SocketProvider>
            </SessionProvider>
        </QueryClientProvider>
    );
}
