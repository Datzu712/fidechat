import React, {
    createContext,
    type ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';
import type { IUser } from '../interfaces/user';
import type { IExtendedChannel } from '../interfaces/channel';
import { getChannels, getUsers, pingDatabase } from '../services/api';

interface IGlobalContext {
    currentUser: IUser | null;
    users: IUser[];
    channels: IExtendedChannel[];
    apiPing: string | null;
    setChannels: React.Dispatch<React.SetStateAction<IExtendedChannel[]>>;
    setSelectedChannel: React.Dispatch<
        React.SetStateAction<IExtendedChannel | null>
    >;
    selectedChannel: IExtendedChannel | null;
    isAuthenticated: boolean;
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GlobalContext = createContext<IGlobalContext>(
    {} as IGlobalContext,
);

export interface IGlobalProviderProps {
    readonly children: ReactNode;
}

export function GlobalProvider({ children }: IGlobalProviderProps) {
    const [currentUser] = useState<IUser | null>(
        () =>
            JSON.parse(localStorage.getItem('data') ?? 'null') as IUser | null,
    );
    const [users, setUsers] = useState<IUser[]>([]);
    const [channels, setChannels] = useState<IExtendedChannel[]>([]);
    const [apiPing, setApiPing] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [selectedChannel, setSelectedChannel] =
        useState<IExtendedChannel | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        console.debug('Fetching data...');

        const intervalId = setInterval(() => {
            if (!selectedChannel) {
                console.debug('Ping api...');
                pingDatabase().then(setApiPing).catch(console.error);
            }
        }, 3000);

        getUsers().then(setUsers).catch(console.error);
        getChannels().then(setChannels).catch(console.error);

        return () => clearInterval(intervalId);
    }, [isAuthenticated]);

    const contextValue = useMemo(
        () => ({
            currentUser,
            users,
            channels,
            apiPing,
            setChannels,
            selectedChannel,
            setSelectedChannel,
            isAuthenticated,
            setIsAuthenticated,
        }),
        [
            currentUser,
            users,
            channels,
            apiPing,
            selectedChannel,
            isAuthenticated,
        ],
    );

    return (
        <GlobalContext.Provider value={contextValue}>
            {children}
        </GlobalContext.Provider>
    );
}
