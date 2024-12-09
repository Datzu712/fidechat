import { useContext, useEffect, useRef, useState } from 'react';
import { ApiError, getWebsocketConnection } from '../services/api';
import { GlobalContext } from '../contexts/GlobalContext';
import { IWebsocketEvent } from '../interfaces/websocketEvent';
import { useNavigate } from 'react-router';

function useWebsocketConnection({
    isAuthenticated,
}: {
    isAuthenticated: boolean;
}) {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const navigate = useNavigate();
    const { setChannels, setSelectedChannel, channels, selectedChannel } =
        useContext(GlobalContext);

    const channelsRef = useRef(channels);
    const selectedChannelRef = useRef(selectedChannel);

    useEffect(() => {
        channelsRef.current = channels;
        selectedChannelRef.current = selectedChannel;
    }, [channels, selectedChannel]);

    const handleWebSocketMessage = (event: MessageEvent) => {
        console.log(channelsRef.current);
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
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            if (ws) {
                ws.close();
                setWs(null);
            }
            return;
        }

        const setUpWebsocketConnection = async () => {
            try {
                const token = await getWebsocketConnection();
                if (!token) return;

                if (ws) {
                    console.error('Websocket connection already exists');
                    return ws;
                }

                const newWs = new WebSocket(
                    import.meta.env.VITE_WS_URL + '/ws?token=' + token,
                );

                newWs.onopen = () => console.log('Connected to websocket');
                newWs.onmessage = handleWebSocketMessage;
                newWs.onclose = () =>
                    console.log('Disconnected from websocket');

                return newWs;
            } catch (error) {
                console.error(error);
                if (error instanceof ApiError && error.isUnauthorized) {
                    navigate('/login');
                }
            }
        };

        const newWs = setUpWebsocketConnection();

        return () => {
            newWs?.then((ws) => ws?.close());
        };
    }, [isAuthenticated]);

    return { ws };
}

export default useWebsocketConnection;
