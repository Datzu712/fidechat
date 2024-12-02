import React, {
    createContext,
    ReactNode,
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
}

export const GlobalContext = createContext<IGlobalContext>(
    {} as IGlobalContext,
);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser] = useState<IUser | null>(
        JSON.parse(localStorage.getItem('data')! ?? null) as IUser,
    );
    const [users, setUsers] = useState<IUser[]>([]);
    const [channels, setChannels] = useState<IExtendedChannel[]>([]);
    const [apiPing, setApiPing] = useState<string | null>(null);
    const [selectedChannel, setSelectedChannel] =
        useState<IExtendedChannel | null>(null);

    useEffect(() => {
        console.debug('Fetching data...');

        const intervalId = setInterval(() => {
            if (!selectedChannel) {
                console.debug('Ping api...');
                pingDatabase().then(setApiPing).catch(console.error);
            }
        }, 3000);

        getUsers().then(setUsers).catch(console.error);
        getChannels().then(setChannels).catch(console.error);

        return () => clearInterval(intervalId); // Limpia el intervalo cuando el efecto se desmonte o se vuelva a ejecutar
    }, [selectedChannel]);

    const contextValue = useMemo(
        () => ({
            currentUser,
            users,
            channels,
            apiPing,
            setChannels,
            selectedChannel,
            setSelectedChannel,
        }),
        [currentUser, users, channels, apiPing, selectedChannel],
    );

    return (
        <GlobalContext.Provider value={contextValue}>
            {children}
        </GlobalContext.Provider>
    );
};
