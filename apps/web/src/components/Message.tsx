import { useContext } from 'react';
import { GlobalContext } from '../contexts/GlobalContext';

export interface MessageProps {
    readonly id: string;
    readonly content: string;
    readonly authorId: string;
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
function Message({ id, content, authorId }: MessageProps): JSX.Element {
    const { users, currentUser } = useContext(GlobalContext);

    let name = '';

    if (currentUser?.id === authorId) {
        name = 'You';
    } else {
        const author = users.find((user) => user.id === authorId);
        name = author ? author.name : 'Unknown';
    }

    return (
        <div key={id} className="mb-3 p-2 bg-body-tertiary rounded shadow-sm">
            <div className="fw-bold">{name}</div>
            <div>{content}</div>
        </div>
    );
}

export default Message;
