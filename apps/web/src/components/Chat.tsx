import { useContext, useState } from 'react';
import Message from './Message';
import { GlobalContext } from '../contexts/GlobalContext';
import type { IMessage } from '../interfaces/message';
import { createMessage } from '../services/api';

function Chat() {
    console.log('Chat rendered');

    const [inputValue, setInputValue] = useState<string>('');
    const { selectedChannel, currentUser } = useContext(GlobalContext);

    const handleSend = async () => {
        if (!inputValue.length) return;

        try {
            const newMessage: Omit<IMessage, 'id'> = {
                content: inputValue,
                channelId: selectedChannel!.id,
                authorId: currentUser!.id,
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

    return (
        <div className="card-body d-flex flex-column p-0">
            <div className="flex-grow-1 overflow-auto p-3 bg-dark">
                {selectedChannel?.messages
                    .filter((msg) => msg.channelId === selectedChannel?.id)
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
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={handleKeyDown}
                />
                <button className="btn btn-primary" onClick={handleSend}>
                    Send
                </button>
            </div>
        </div>
    );
}

export default Chat;
