export interface Message {
    id: string;
    content: string;
    authorId: string;
    channelId: string;
    /** ISO 8601: dates travel as strings over JSON. */
    createdAt: string;
}
