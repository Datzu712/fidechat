import type { UserStatus } from '../../types/index.js';

export interface ConnectedUser {
    userId: string;
    status: UserStatus;
    isTyping: boolean;
    /** The channel the user is typing in. */
    typingInChannel?: string;
}
