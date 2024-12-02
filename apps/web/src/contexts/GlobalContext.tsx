import React, {
    createContext,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { IUser } from '../interfaces/user';
import { IChannel } from '../interfaces/channel';
import { IMessage } from '../interfaces/message';
import { getChannels, getUsers, pingDatabase } from '../services/api';

interface IGlobalContext {
    currentUser: IUser;
    users: IUser[];
    channels: IChannel[];
    messages: IMessage[];
    apiPing: string | null;
    setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
    setChannels: React.Dispatch<React.SetStateAction<IChannel[]>>;
    setSelectedChannel: React.Dispatch<React.SetStateAction<IChannel | null>>;
    selectedChannel: IChannel | null;
}

export const GlobalContext = createContext<IGlobalContext>(
    {} as IGlobalContext,
);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser] = useState<IUser>(
        JSON.parse(localStorage.getItem('data')!) as IUser,
    );
    const [users, setUsers] = useState<IUser[]>([]);
    const [channels, setChannels] = useState<IChannel[]>([]);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [apiPing, setApiPing] = useState<string | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<IChannel | null>(
        null,
    );

    useEffect(() => {
        console.log('Fetching data...');

        const intervalId = setInterval(() => {
            if (!selectedChannel) {
                console.log('Ping api...');
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
            messages,
            apiPing,
            setMessages,
            setChannels,
            selectedChannel,
            setSelectedChannel,
        }),
        [currentUser, users, channels, messages, apiPing, selectedChannel],
    );

    return (
        <GlobalContext.Provider value={contextValue}>
            {children}
        </GlobalContext.Provider>
    );
};
