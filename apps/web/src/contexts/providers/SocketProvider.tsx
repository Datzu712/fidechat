/**
 * Todos:
 * - [ ] Manage reconnection sync issues. (the API refreshes the session token on each handshake)
 */
import useAuth from '@/hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketContext } from '../socketContext';
import { apiClient } from '@/lib/api/client';

/** Delay before checking the session again while Keycloak or the API is unavailable. */
const RETRY_MS = 5000;

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [connected, setConnected] = useState(false);
    const { status } = useAuth();
    const socket = useRef<Socket | null>(null);

    useEffect(() => {
        if (status !== 'authenticated') return;
        // At most one pending session check; the cleanup below cancels it.
        let retry: ReturnType<typeof setTimeout> | undefined;
        const retryLater = () => {
            clearTimeout(retry);
            retry = setTimeout(recheckSession, RETRY_MS);
        };

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
        // The server closes the socket when its session ends and refuses the handshake without a
        // valid session (sessions live in memory, so an API restart ends them). Reconnect while the
        // session is valid; log in again when it is gone; retry later while Keycloak or the API is
        // unavailable.
        // apiClient sends the user to /login on a 401.
        const recheckSession = () => {
            retry = undefined;
            apiClient.get('/auth/me').then(
                () => socket.current?.connect(),
                (error: { response?: { status: number } }) => {
                    if (error.response?.status !== 401) retryLater();
                },
            );
        };
        socket.current.on('disconnect', (reason) => {
            setConnected(false);
            console.debug('Disconnected from socket server', reason);
            if (reason === 'io server disconnect') recheckSession();
        });
        socket.current.on('connect_error', (err: Error) => {
            setConnected(false);
            console.error('Socket connection error:', err);
            if (err.message === 'Unauthorized') recheckSession();
            else if (err.message === 'Service unavailable') retryLater();
        });

        return () => {
            clearTimeout(retry);
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
