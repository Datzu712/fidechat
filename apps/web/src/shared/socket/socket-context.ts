import { createContext } from 'react';

interface SocketContextType {
    connected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
    connected: false,
});
