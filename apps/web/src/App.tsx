import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState<string>('');

    const handleSend = () => {
        if (!input.length) return;

        setMessages([...messages, input]);
        setInput('');
    };

    return (
        <div className="card vh-100">
            <div className="card-header bg-primary-subtle text-white text-center">
                <h1>Fidechat</h1>
            </div>
            <div className="card-body d-flex flex-column p-0">
                <div className="flex-grow-1 overflow-auto p-3 bg-dark">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className="mb-3 p-2 bg-body-tertiary rounded shadow-sm"
                        >
                            {msg}
                        </div>
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
