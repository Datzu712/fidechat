export interface Message {
    id: string;
    content: string;
    authorId: string;
    channelId: string;
    createdAt: Date;
}

export type MessageCreationAttributes = Omit<Message, 'id' | 'createdAt'>;
