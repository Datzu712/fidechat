import { createContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Message from './components/Message';
import Sidebar from './components/Sidebar';
import type { IMessage } from './interfaces/message';
import { IUser } from './interfaces/user';

async function createMessage(message: Omit<IMessage, 'id'>) {
    try {
        const response = await fetch(
            import.meta.env.VITE_API_URL + '/api/messages',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
                credentials: 'include',
            },
        );
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.warn(error);
    }
}

export const UserContext = createContext<IUser>(null as unknown as IUser);

function App() {
    const [currentUser, setUser] = useState<IUser>(
        JSON.parse(localStorage.getItem('data')!) as IUser,
    );

    const [messages, setMessages] = useState<IMessage[]>([]);
    const [input, setInput] = useState<string>('');
    const [channels, setChannels] = useState<string[]>([
        'general',
        'random',
        'help',
    ]);
    const [selectedChannel, setSelectedChannel] = useState<string>('general');
    const ws = useRef<WebSocket | null>(null);
    const navigate = useNavigate();

    const handleSend = async () => {
        if (!input.length) return;

        try {
            const newMessage: Omit<IMessage, 'id'> = {
                content: input,
                channel_id: selectedChannel,
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
        async function getWebsocketConnection() {
            try {
                const response = await fetch(
                    import.meta.env.VITE_API_URL + '/api/auth/ws/token',
                    {
                        method: 'POST',
                        credentials: 'include',
                    },
                );
                if (response.status === 401 || response.status === 403) {
                    navigate('/login');
                    return null;
                }
                console.log(response.status);

                const res = await response.json();
                return res.token;
            } catch (error) {
                console.warn(error);
                return null;
            }
        }

        async function setUpWebsocketConnection() {
            const token = await getWebsocketConnection();
            if (!token) return;

            ws.current = new WebSocket(
                import.meta.env.VITE_WS_URL + '/ws?token=' + token,
            );

            ws.current.onopen = () => console.log('Connected to websocket');
            ws.current.onmessage = (event) => {
                // const message = JSON.parse(event.data);
                // setMessages((prevMessages) => [...prevMessages, message]);
            };
            ws.current.onclose = () => {
                console.log('Disconnected from websocket');
            };

            return () => {
                ws.current?.close();
            };
        }
        setUpWebsocketConnection();
    }, [navigate]);

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
                                    (msg) => msg.channel_id === selectedChannel,
                                )
                                .map((msg) => (
                                    <Message
                                        key={msg.id}
                                        id={msg.id}
                                        content={msg.content}
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
