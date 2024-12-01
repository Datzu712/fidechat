import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Header from './components/Header';
import Message from './components/Message';

function App() {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState<string>('');
    const ws = useRef<WebSocket | null>(null);
    const navigate = useNavigate();

    const handleSend = () => {
        if (!input.length) return;

        ws.current?.send(input);
        setMessages([...messages, input]);
        setInput('');
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
                setMessages([...messages, event.data]);
            };
            ws.current.onclose = () => {
                console.log('Disconnected from websocket');
            };

            return () => {
                ws.current?.close();
            };
        }
        setUpWebsocketConnection();
    }, [messages, navigate]);

    return (
        <div className="card vh-100">
            <Header />
            <div className="card-body d-flex flex-column p-0">
                <div className="flex-grow-1 overflow-auto p-3 bg-dark">
                    {messages.map((msg, index) => (
                        <Message key={index} id={index} content={msg} />
                    ))}
                </div>
                <div className="card-footer d-flex p-3 bg-body-tertiary  border-top">
                    <input
                        type="text"
                        className="form-control me-2"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button className="btn btn-primary" onClick={handleSend}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
export default App;
