import React, {
    createContext,
    type ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';
import type { IUser } from '../interfaces/user';
import type { IExtendedChannel } from '../interfaces/channel';
import { pingDatabase } from '../services/api';
import { Toast, ToastContainer } from 'react-bootstrap';

type ToastMessage = {
    message: string;
    bg: string;
    delay?: number;
};

interface IGlobalContext {
    currentUser: IUser | null;
    users: IUser[];
    setUsers: React.Dispatch<React.SetStateAction<IUser[]>>;
    channels: IExtendedChannel[];
    apiPing: string | null;
    setChannels: React.Dispatch<React.SetStateAction<IExtendedChannel[]>>;
    setSelectedChannel: React.Dispatch<
        React.SetStateAction<IExtendedChannel | null>
    >;
    selectedChannel: IExtendedChannel | null;
    isAuthenticated: boolean;
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
    toastMessages: ToastMessage[];
    setToastMessages: React.Dispatch<React.SetStateAction<ToastMessage[]>>;
}

export const GlobalContext = createContext<IGlobalContext>(
    {} as IGlobalContext,
);

export interface IGlobalProviderProps {
    readonly children: ReactNode;
}

export function GlobalProvider({ children }: IGlobalProviderProps) {
    const [currentUser, setCurrentUser] = useState<IUser | null>(
        () =>
            JSON.parse(localStorage.getItem('data') ?? 'null') as IUser | null,
    );
    const [users, setUsers] = useState<IUser[]>([]);
    const [channels, setChannels] = useState<IExtendedChannel[]>([]);
    const [apiPing, setApiPing] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [selectedChannel, setSelectedChannel] =
        useState<IExtendedChannel | null>(null);

    const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);

    useEffect(() => {
        if (!isAuthenticated) return;

        console.debug('Fetching data...');

        setCurrentUser(
            JSON.parse(localStorage.getItem('data') ?? 'null') as IUser | null,
        );

        const intervalId = setInterval(() => {
            if (!selectedChannel) {
                console.debug('Ping api...');
                pingDatabase().then(setApiPing).catch(console.error);
            }
        }, 3000);

        // getUsers()
        //     .then(setUsers)
        //     .catch((e) => {
        //         console.error(e);
        //         setToastMessages((prev) => [
        //             ...prev,
        //             {
        //                 message: 'Failed to fetch users',
        //                 bg: 'danger',
        //             },
        //         ]);
        //     });
        // getChannels()
        //     .then(setChannels)
        //     .catch((e) => {
        //         console.error(e);
        //         setToastMessages((prev) => [
        //             ...prev,
        //             {
        //                 message: 'Failed to fetch channels',
        //                 bg: 'danger',
        //             },
        //         ]);
        //     });

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
            toastMessages,
            setToastMessages,
            setUsers,
        }),
        [
            currentUser,
            users,
            channels,
            apiPing,
            selectedChannel,
            isAuthenticated,
            toastMessages,
        ],
    );

    return (
        <GlobalContext.Provider value={contextValue}>
            <ToastContainer position="top-end" className="p-3">
                {toastMessages.map(({ bg, message, delay = 10000 }, index) => (
                    <Toast
                        key={index}
                        bg={bg}
                        onClose={() => {
                            const newToastMessages = [...toastMessages];
                            newToastMessages.splice(index, 1);
                            setToastMessages(newToastMessages);
                        }}
                        delay={delay}
                        autohide
                    >
                        <Toast.Header>
                            <strong className="me-auto">Info</strong>
                        </Toast.Header>
                        <Toast.Body>{message}</Toast.Body>
                    </Toast>
                ))}
            </ToastContainer>
            {children}
        </GlobalContext.Provider>
    );
}
