/**
 * Todos:
 * - [ ] Manage reconnection sync issues. (the API refreshes the session token on each handshake)
 */
import useAuth from '@/hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketContext } from '../socketContext';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [connected, setConnected] = useState(false);
    const { status } = useAuth();
    const socket = useRef<Socket | null>(null);

    useEffect(() => {
        if (status !== 'authenticated') return;

        if (socket.current) {
            socket.current.disconnect();
        }

        // Same origin as the page: the handshake carries the BFF session cookie.
        socket.current = io({
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
            console.debug('[socket] Socket event sent:', event, args);
        });

        socket.current.on('connect', () => {
            setConnected(true);
            console.debug('Connected to socket server');
        });
        socket.current.on('disconnect', (reason) => {
            setConnected(false);
            console.debug('Disconnected from socket server', reason);
            // The server drops the socket when the session is gone (for example after an API restart,
            // since sessions live in memory): go back through the login if that is the case.
            if (reason === 'io server disconnect') {
                void fetch('/api/v1/auth/me').then((response) => {
                    if (response.status === 401)
                        window.location.href = '/login';
                });
            }
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
    }, [status]);

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
