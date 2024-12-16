import { useContext } from 'react';
import { GlobalContext } from '../contexts/GlobalContext';
import AvatarURL from '@assets/avatar.png';

export interface MessageProps {
    readonly content: string;
    readonly authorId: string;
    readonly createdAt: Date;
}

/**
 * Component to display a message.
 *
 * @param { MessageProps } props - The properties for the Message component.
 * @param { string } props.id - The unique identifier for the message.
 * @param { string } props.content - The content of the message.
 * @param { string } props.authorId - The unique identifier of the author of the message.
 * @returns {JSX.Element } The rendered Message component.
 */
function Message({ content, authorId, createdAt }: MessageProps): JSX.Element {
    const { users, currentUser } = useContext(GlobalContext);

    let name = '';

    if (currentUser?.id === authorId) {
        name = 'You';
    } else {
        const author = users.find((user) => user.id === authorId);
        name = author ? author.name : 'Unknown';
    }

    return (
        <article className="mb-3 pt-2 ps-2 rounded shadow bg-body-tertiary d-flex">
            <img src={AvatarURL} alt={name} className="message-avatar" />
            <div>
                <header>
                    <span className="message-username">{name}</span>
                    <span className="message-timestamp">
                        {createdAt.toLocaleTimeString()}
                    </span>
                </header>
                <p className="message-content">{content}</p>
            </div>
        </article>
    );
}

export default Message;
