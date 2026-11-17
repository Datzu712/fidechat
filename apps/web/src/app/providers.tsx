import { ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/auth-provider';
import { AppProvider } from '@/features/sync/app-provider';
import { QueryProvider } from '@/shared/api/query-provider';
import { SocketProvider } from '@/shared/socket/socket-provider';

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
