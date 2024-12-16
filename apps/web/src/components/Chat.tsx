import { useContext, useEffect, useRef, useState } from 'react';
import Message from '@components/Message';
import { GlobalContext } from '@contexts/GlobalContext';
import type { IMessage } from '../interfaces/message';
import { createMessage } from '../services/api';

function Chat() {
    const [inputValue, setInputValue] = useState<string>('');
    const { selectedChannel, currentUser } = useContext(GlobalContext);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSend = async () => {
        if (!inputValue.length) return;

        try {
            const newMessage: Omit<IMessage, 'id'> = {
                content: inputValue,
                channelId: selectedChannel!.id,
                authorId: currentUser!.id,
                createdAt: new Date().toISOString(),
            };

            createMessage(newMessage);
            setInputValue('');
        } catch (error) {
            console.error(error);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSend();
        }
    };

    const scrollToBottom = () => {
        console.log(messagesEndRef.current?.scrollHeight);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [selectedChannel?.messages]);

    return (
        <section className="card-body d-flex flex-column p-0 mt-5">
            <div className="flex-grow-1 overflow-auto p-3 bg-dark">
                {selectedChannel?.messages
                    .filter((msg) => msg.channelId === selectedChannel?.id)
                    .map((msg) => (
                        <Message
                            key={msg.id}
                            content={msg.content}
                            authorId={msg.authorId}
                            createdAt={new Date(msg.createdAt)}
                        />
                    ))}
                <div ref={messagesEndRef} />
            </div>

            <footer className="card-footer d-flex p-3 bg-body-tertiary border-top sticky-bottom">
                <input
                    type="text"
                    className="form-control me-2"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={handleKeyDown}
                />
                <button className="btn btn-primary" onClick={handleSend}>
                    Send
                </button>
            </footer>
        </section>
    );
}

export default Chat;
