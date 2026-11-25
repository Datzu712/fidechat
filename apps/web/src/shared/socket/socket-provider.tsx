import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { backend } from '@/shared/backend/implementation';
import { SocketContext } from '@/shared/socket/socket-context';

/** Opens the realtime connection while the session is authenticated. */
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [connected, setConnected] = useState(false);
    const { status } = useAuth();

    useEffect(() => {
        if (status !== 'authenticated') return;

        const unsubscribe = backend.onConnectionChange(setConnected);
        backend.connect();

        return () => {
            unsubscribe();
            backend.disconnect();
            setConnected(false);
        };
    }, [status]);

    return (
        <SocketContext.Provider value={{ connected }}>
            {children}
        </SocketContext.Provider>
    );
};
