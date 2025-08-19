'use client';

/**
 * Todos:
 * - [ ] Manage reconnection sync issues. (atm are fixed by adding more ttl to user's token provided by Keycloak)
 */
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketContext } from '../socketContext';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [connected, setConnected] = useState(false);
    const { data, status } = useSession();
    const socket = useRef<Socket | null>(null);

    useEffect(() => {
        if (status !== 'authenticated') return;

        if (socket.current) {
            socket.current.disconnect();
        }

        socket.current = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
            auth: {
                token: data?.accessToken,
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling', 'webtransport'],
            timeout: 10000,
        });

        socket.current.onAny((event, ...args) => {
            console.debug('[socket] Socket event received:', event, args);
        });

        socket.current.onAnyOutgoing((event, ...args) => {
            console.debug('Socket event sent:', event, args);
        });

        socket.current.on('connect', () => {
            setConnected(true);
            console.debug('Connected to socket server');
        });
        socket.current.on('disconnect', () => {
            setConnected(false);
            console.debug('Disconnected from socket server');
        });
        socket.current.on('connect_error', (err: Error) => {
            setConnected(false);
            console.error('Socket connection error:', err);
        });

        return () => {
            if (socket.current) {
                socket.current.removeAllListeners();
                socket.current.disconnect();
                socket.current = null;
            }
            setConnected(false);
        };
    }, [data?.accessToken, status]);

    return (
        <SocketContext.Provider
            value={{
                socket,
                disconnect: () => socket.current?.disconnect(),
                connected,
                emit: <D,>(event: string, data?: D) =>
                    socket.current?.emit(event, data),
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};
