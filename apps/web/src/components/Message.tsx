export interface MessageProps {
    readonly id: string;
    readonly content: string;
}

function Message({ id, content }: MessageProps): JSX.Element {
    return (
        <div key={id} className="mb-3 p-2 bg-body-tertiary rounded shadow-sm">
            {content}
        </div>
    );
}

export default Message;
