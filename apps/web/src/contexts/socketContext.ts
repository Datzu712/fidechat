import { createContext } from 'react';
import { type Socket } from 'socket.io-client';

interface SocketContextType {
    socket: React.RefObject<Socket | null>;
    disconnect: () => void;
    connected: boolean;
    emit: <D>(event: string, data?: D) => void;
}

export const SocketContext = createContext<SocketContextType>(
    {} as SocketContextType,
);
