import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Message from './components/Message';
import Sidebar from './components/Sidebar';
import type { IMessage } from './interfaces/message';
import { IWebsocketEvent } from './interfaces/websocketEvent';
import { IChannel } from './interfaces/channel';
import {
    createMessage,
    getChannels,
    getUsers,
    getWebsocketConnection,
    pingDatabase,
} from './services/api';
import { GlobalContext } from './contexts/GlobalContext';

function sortChannels(channels: IChannel[]) {
    return channels.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });
}

function App() {
    const {
        currentUser,
        users,
        channels,
        setChannels,
        messages,
        setMessages,
        selectedChannel,
        setSelectedChannel,
        apiPing,
    } = useContext(GlobalContext)!;
    const [input, setInput] = useState<string>('');
    const ws = useRef<WebSocket | null>(null);
    const navigate = useNavigate();

    const handleSend = async () => {
        if (!input.length) return;

        try {
            const newMessage: Omit<IMessage, 'id'> = {
                content: input,
                channel_id: selectedChannel!.id,
                author_id: currentUser.id,
            };

            createMessage(newMessage);
            setInput('');

            setMessages((prevMessages) => [
                ...prevMessages,
                { ...newMessage, id: Math.random().toString() },
            ]);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        async function setUpWebsocketConnection() {
            const token = await getWebsocketConnection(navigate);
            if (!token) return;

            const channels = await getChannels();
            setChannels(sortChannels(channels));

            ws.current = new WebSocket(
                import.meta.env.VITE_WS_URL + '/ws?token=' + token,
            );

            ws.current.onopen = () => console.log('Connected to websocket');
            ws.current.onmessage = (event) => {
                const eventData = JSON.parse(event.data) as IWebsocketEvent;

                if (eventData.type === 'MESSAGE_CREATE') {
                    setMessages([...messages, eventData.payload]);
                } else if (eventData.type === 'CHANNEL_CREATE') {
                    setChannels(sortChannels([...channels, eventData.payload]));
                }
            };
            ws.current.onclose = () => {
                console.log('Disconnected from websocket');
            };

            return () => {
                ws.current?.close();
            };
        }
        setUpWebsocketConnection();
    }, [currentUser, messages, navigate, setChannels, setMessages]);

    return (
        <div className="d-flex vh-100">
            <Sidebar
                channels={channels}
                selectedChannel={selectedChannel}
                setSelectedChannel={setSelectedChannel}
            />
            {selectedChannel ? (
                <div className="card flex-grow-1">
                    <Header />
                    <div className="card-body d-flex flex-column p-0">
                        <div className="flex-grow-1 overflow-auto p-3 bg-dark">
                            {messages
                                .filter(
                                    (msg) =>
                                        msg.channel_id === selectedChannel?.id,
                                )
                                .map((msg) => (
                                    <Message
                                        key={msg.id}
                                        id={msg.id}
                                        content={msg.content}
                                        authorId={msg.author_id}
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
                <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                    <h1>Welcome to Fidechat</h1>
                    {apiPing !== null && <h3>API Ping & DB: {apiPing} ms</h3>}
                </div>
            )}
        </div>
    );
}
export default App;
