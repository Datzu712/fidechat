import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from '@fidechat/shared';
import { createContext } from 'react';
import { type Socket } from 'socket.io-client';

/** The socket typed with the shared event maps. */
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextType {
    socket: React.RefObject<AppSocket | null>;
    disconnect: () => void;
    connected: boolean;
}

export const SocketContext = createContext<SocketContextType>(
    {} as SocketContextType,
);
