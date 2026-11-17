import { ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/providers/auth-provider';
import { useRealtimeSync } from '@/features/sync/hooks/use-realtime-sync';
import { QueryProvider } from '@/shared/api/query-provider';
import { SocketProvider } from '@/shared/socket/socket-provider';

function RealtimeSync() {
    useRealtimeSync();
    return null;
}

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryProvider>
            <AuthProvider>
                <SocketProvider>
                    <RealtimeSync />
                    {children}
                </SocketProvider>
            </AuthProvider>
        </QueryProvider>
    );
}
