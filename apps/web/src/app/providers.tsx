'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

import QueryProvider from '@/src/lib/api/QueryProvider';
import { SocketProvider } from '@/src/contexts/providers/SocketProvider';
import { AppProvider } from '../contexts/providers/AppProvider';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryProvider>
            <SessionProvider refetchInterval={60}>
                <SocketProvider>
                    <AppProvider>{children}</AppProvider>
                </SocketProvider>
            </SessionProvider>
        </QueryProvider>
    );
}
