import { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Header from './components/Header';
import Message from './components/Message';

function App() {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState<string>('');
    const ws = useRef<WebSocket | null>(null);

    const handleSend = () => {
        if (!input.length) return;

        ws.current?.send(input);
        setMessages([...messages, input]);
        setInput('');
    };

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080/ws');

        socket.addEventListener('open', () => {
            console.log('Connected to server');
        });

        socket.addEventListener('message', (event) => {
            setMessages([...messages, event.data]);
        });

        socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
        });

        socket.addEventListener('close', (event) => {
            console.log('WebSocket closed:', event.code);
        });

        ws.current = socket;

        return () => ws.current?.close();
    }, [messages]);

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
