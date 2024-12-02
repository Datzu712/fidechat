import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Message from './components/Message';
import Sidebar from './components/Sidebar';
import type { IMessage } from './interfaces/message';
import type { IWebsocketEvent } from './interfaces/websocketEvent';
import type { IExtendedChannel } from './interfaces/channel';
import { createMessage, getWebsocketConnection } from './services/api';
import { GlobalContext } from './contexts/GlobalContext';

function sortChannels(channels: IExtendedChannel[]) {
    return channels.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });
}

function App() {
    const {
        currentUser,
        channels,
        setChannels,
        selectedChannel,
        setSelectedChannel,
        apiPing,
    } = useContext(GlobalContext)!;
    const [input, setInput] = useState<string>('');
    const ws = useRef<WebSocket | null>(null);
    const navigate = useNavigate();

    const channelsRef = useRef<IExtendedChannel[]>(channels);
    const selectedChannelRef = useRef<IExtendedChannel | null>(selectedChannel);

    useEffect(() => {
        channelsRef.current = channels;
    }, [channels]);

    useEffect(() => {
        selectedChannelRef.current = selectedChannel;
    }, [selectedChannel]);

    const handleSend = async () => {
        if (!input.length) return;

        try {
            const newMessage: Omit<IMessage, 'id'> = {
                content: input,
                channelId: selectedChannel!.id,
                authorId: currentUser!.id,
            };

            createMessage(newMessage);
            setInput('');
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        async function setUpWebsocketConnection() {
            const token = await getWebsocketConnection(navigate);
            if (!token) return;

            if (ws.current) return;

            ws.current = new WebSocket(
                import.meta.env.VITE_WS_URL + '/ws?token=' + token,
            );

            ws.current.onopen = () => console.log('Connected to websocket');
            ws.current.onmessage = (event) => {
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
                        sortChannels(
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
                        ),
                    );
                    if (selectedChannelRef.current?.id === targetChannel.id) {
                        setSelectedChannel({
                            ...targetChannel,
                            messages: [
                                ...targetChannel.messages,
                                eventData.payload,
                            ],
                        });
                    }
                } else if (eventData.type === 'CHANNEL_CREATE') {
                    setChannels(
                        sortChannels([
                            ...channelsRef.current,
                            { ...eventData.payload, messages: [] },
                        ]),
                    );
                }
            };
            ws.current.onclose = () => {
                console.log('Disconnected from websocket');
            };

            return () => {
                ws.current?.close();
            };
        }
        if (!ws.current) {
            setUpWebsocketConnection();
        }
    }, [navigate, setChannels, setSelectedChannel]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="d-flex vh-100">
            <Sidebar
                channels={channels}
                selectedChannel={selectedChannel}
                setSelectedChannel={setSelectedChannel}
            />
            {selectedChannel ? (
                <div className="card flex-grow-1 main-content">
                    <Header />
                    <div className="card-body d-flex flex-column p-0">
                        <div className="flex-grow-1 overflow-auto p-3 bg-dark">
                            {selectedChannel?.messages
                                .filter(
                                    (msg) =>
                                        msg.channelId === selectedChannel?.id,
                                )
                                .map((msg) => (
                                    <Message
                                        key={msg.id}
                                        id={msg.id}
                                        content={msg.content}
                                        authorId={msg.authorId}
                                    />
                                ))}
                        </div>
                        <div className="card-footer d-flex p-3 bg-body-tertiary border-top">
                            <input
                                type="text"
                                className="form-control me-2"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type a message..."
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleSend}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center main-content">
                    <h1>Welcome to Fidechat</h1>
                    {apiPing !== null && <h3>API Ping & DB: {apiPing} ms</h3>}
                </div>
            )}
        </div>
    );
}
export default App;
