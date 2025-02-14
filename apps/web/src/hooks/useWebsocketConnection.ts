import { useContext, useEffect, useRef, useState } from 'react';
import {
    ApiError,
    getChannels,
    getUsers,
    getWebsocketConnection,
} from '../services/api';
import { GlobalContext } from '../contexts/GlobalContext';
import { IWebsocketEvent } from '../interfaces/websocketEvent';
import { useNavigate } from 'react-router';

function useWebsocketConnection({
    isAuthenticated,
}: {
    isAuthenticated: boolean;
}) {
    const {
        setChannels,
        setSelectedChannel,
        channels,
        selectedChannel,
        setToastMessages,
        setUsers,
    } = useContext(GlobalContext);

    const wsRef = useRef<WebSocket | null>(null);
    const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

    const navigate = useNavigate();
    const channelsRef = useRef(channels);
    const selectedChannelRef = useRef(selectedChannel);

    useEffect(() => {
        channelsRef.current = channels;
        selectedChannelRef.current = selectedChannel;
    }, [channels, selectedChannel]);

    const handleWebSocketMessage = (event: MessageEvent) => {
        console.log('Received message:', event.data);

        const eventData = JSON.parse(event.data) as IWebsocketEvent;

        if (eventData.type === 'MESSAGE_CREATE') {
            const targetChannel = channelsRef.current.find(
                (c) => c.id == eventData.payload.channelId,
            );
            if (!targetChannel) {
                console.error(
                    'Channel not found: ' + eventData.payload.channelId,
                );
                return;
            }
            setChannels(
                channelsRef.current.map((c) =>
                    c.id === targetChannel.id
                        ? {
                              ...targetChannel,
                              messages: [
                                  ...targetChannel.messages,
                                  eventData.payload,
                              ],
                          }
                        : c,
                ),
            );
            if (selectedChannelRef.current?.id === targetChannel.id) {
                setSelectedChannel({
                    ...targetChannel,
                    messages: [...targetChannel.messages, eventData.payload],
                });
            }
        } else if (eventData.type === 'CHANNEL_CREATE') {
            setChannels([
                ...channelsRef.current,
                { ...eventData.payload, messages: [] },
            ]);
        } else if (eventData.type === 'CHANNEL_UPDATE') {
            if (eventData.payload.id === selectedChannelRef.current?.id) {
                setSelectedChannel({
                    ...selectedChannelRef.current,
                    ...eventData.payload,
                });
            }

            setChannels(
                channelsRef.current.map((c) =>
                    c.id === eventData.payload.id
                        ? { ...c, ...eventData.payload }
                        : c,
                ),
            );
        } else if (eventData.type === 'CHANNEL_DELETE') {
            setChannels(
                channelsRef.current.filter((c) => c.id !== eventData.payload),
            );
            if (selectedChannelRef.current?.id === eventData.payload) {
                setSelectedChannel(null);
            }
        }
    };

    const setUpWebsocketConnection = async () => {
        if (wsRef.current) {
            return;
        }

        try {
            const token = await getWebsocketConnection();
            if (!token) {
                setToastMessages((prev) => [
                    ...prev,
                    {
                        bg: 'danger',
                        message:
                            'Error authenticating your browser to websocket server',
                        delay: 5000,
                    },
                ]);
                return;
            }

            const newWs = new WebSocket(
                import.meta.env.VITE_WS_URL + '/ws?token=' + token,
            );

            newWs.onopen = () => {
                setIsReconnecting(false);
                setToastMessages((prev) => [
                    ...prev,
                    {
                        bg: 'success',
                        message: 'Connected to websocket',
                        delay: 5000,
                    },
                ]);
                getUsers()
                    .then(setUsers)
                    .catch((e) => {
                        console.error(e);
                        setToastMessages((prev) => [
                            ...prev,
                            {
                                message: 'Failed to fetch users',
                                bg: 'danger',
                            },
                        ]);
                    });
                getChannels()
                    .then((channels) => setChannels(channels))
                    .catch((e) => {
                        console.error(e);
                        setToastMessages((prev) => [
                            ...prev,
                            {
                                message: 'Failed to fetch channels',
                                bg: 'danger',
                            },
                        ]);
                    });
            };
            newWs.onmessage = handleWebSocketMessage;
            newWs.onerror = (error) => {
                console.error(error);
                setToastMessages((prev) => [
                    ...prev,
                    {
                        bg: 'danger',
                        message: 'Error connecting to websocket',
                        delay: 5000,
                    },
                ]);
            };
            newWs.onclose = () => {
                setToastMessages((prev) => [
                    ...prev,
                    {
                        bg: 'danger',
                        message: 'Disconnected from websocket. Reconnecting...',
                        delay: 5000,
                    },
                ]);
                setIsReconnecting(true);
                wsRef.current = null;
            };

            wsRef.current = newWs;
            return newWs;
        } catch (error) {
            console.error(error);
            if (error instanceof ApiError && error.isUnauthorized) {
                navigate('/login');
            }
        }
    };

    useEffect(() => {
        if (!isReconnecting) {
            return;
        }

        const interval = setInterval(() => {
            console.log('Reconnecting to websocket');
            setUpWebsocketConnection();
        }, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [isReconnecting]);

    useEffect(() => {
        if (!isAuthenticated) {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            return;
        }
        setUpWebsocketConnection();

        return () => {
            wsRef.current?.close();
        };
    }, [isAuthenticated]);

    return { ws: wsRef.current };
}

export default useWebsocketConnection;
