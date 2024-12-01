export interface MessageProps {
    readonly id: string;
    readonly content: string;
    readonly userName: string;
}

function Message({ id, content, userName }: MessageProps): JSX.Element {
    return (
        <div key={id} className="mb-3 p-2 bg-body-tertiary rounded shadow-sm">
            <div className="fw-bold">{userName}</div>
            <div>{content}</div>
        </div>
    );
}

export default Message;
