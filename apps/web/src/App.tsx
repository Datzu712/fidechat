import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Message from './components/Message';
import Sidebar from './components/Sidebar';
import type { IMessage } from './interfaces/message';
import { IUser } from './interfaces/user';
import { IWebsocketEvent } from './interfaces/websocketEvent';
import { IChannel } from './interfaces/channel';
import {
    createMessage,
    getChannels,
    getWebsocketConnection,
} from './services/api';
import { UserContext } from './contexts/UserContext';

function App() {
    const [currentUser] = useState<IUser>(
        JSON.parse(localStorage.getItem('data')!) as IUser,
    );

    const [messages, setMessages] = useState<IMessage[]>([]);
    const [input, setInput] = useState<string>('');
    const [channels, setChannels] = useState<IChannel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<IChannel | null>(
        null,
    );
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
            console.log(channels);
            setChannels(channels);

            ws.current = new WebSocket(
                import.meta.env.VITE_WS_URL + '/ws?token=' + token,
            );

            ws.current.onopen = () => console.log('Connected to websocket');
            ws.current.onmessage = (event) => {
                const eventData = JSON.parse(event.data) as IWebsocketEvent;

                if (eventData.type === 'MESSAGE_CREATE') {
                    setMessages([...messages, eventData.payload]);
                } else if (eventData.type === 'CHANNEL_CREATE') {
                    setChannels([...channels, eventData.payload]);
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
    }, [currentUser, messages, navigate]);

    return (
        <div className="d-flex vh-100">
            <UserContext.Provider value={currentUser}>
                <Sidebar
                    channels={channels}
                    selectedChannel={selectedChannel}
                    setSelectedChannel={setSelectedChannel}
                />
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
                                        userName={msg.author_id}
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
            </UserContext.Provider>
        </div>
    );
}
export default App;
