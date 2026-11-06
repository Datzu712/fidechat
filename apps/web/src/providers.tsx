import { ReactNode } from 'react';

import QueryProvider from '@/lib/api/QueryProvider';
import { AuthProvider } from '@/contexts/providers/AuthProvider';
import { SocketProvider } from '@/contexts/providers/SocketProvider';
import { AppProvider } from './contexts/providers/AppProvider';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryProvider>
            <AuthProvider>
                <SocketProvider>
                    <AppProvider>{children}</AppProvider>
                </SocketProvider>
            </AuthProvider>
        </QueryProvider>
    );
}
