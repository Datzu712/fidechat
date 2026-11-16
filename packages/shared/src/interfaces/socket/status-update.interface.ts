import type { ConnectedUser } from './connected-user.interface.js';

/** What a client may change about its own presence. The user is the one the socket authenticated as. */
export type StatusUpdate = Partial<Pick<ConnectedUser, 'status' | 'isTyping' | 'typingInChannel'>>;
