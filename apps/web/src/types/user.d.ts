export interface AppUser {
    id: string;
    username: string;
    email: string;
    isBot: boolean;
    avatarUrl?: string;
}

export type SocketUserStatus =
    | 'online'
    | 'idle'
    | 'dnd'
    | 'offline'
    | undefined; // undefined means offline btw

export interface ConnectedUser {
    userId: string;
    status: SocketUserStatus;
    isTyping: boolean;
    typingInChannel?: string; // which channel the user is typing in
}
