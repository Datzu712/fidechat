import type {
    AuthMe,
    ChannelPayload,
    Guild,
    GuildPayload,
    MessagePayload,
    ServerToClientEvents,
    StatusUpdate,
    SyncPayload,
} from '@fidechat/shared';

/** A failed backend call, with a message fit for the user. */
export class BackendError extends Error {
    constructor(
        message: string,
        readonly status?: number,
    ) {
        super(message);
        this.name = 'BackendError';
    }
}

export interface MessageTarget {
    guildId: string;
    channelId: string;
}

export interface MessageRef extends MessageTarget {
    messageId: string;
}

export interface SessionBackend {
    /** The session's user, or null when there is none. */
    getSession(): Promise<AuthMe | null>;
    /** Ends the session and leaves the app by navigating away. Rejects when it could not. */
    logout(): Promise<void>;
}

export interface RealtimeBackend {
    connect(): void;
    disconnect(): void;
    /** Returns the unsubscribe function. */
    onConnectionChange(listener: (connected: boolean) => void): () => void;
    on<E extends keyof ServerToClientEvents>(
        event: E,
        handler: ServerToClientEvents[E],
    ): () => void;
    updateStatus(update: StatusUpdate): void;
}

export interface GuildBackend {
    sync(): Promise<SyncPayload>;
    getPublicGuilds(): Promise<Guild[]>;
    createGuild(payload: GuildPayload): Promise<void>;
}

export interface ChannelBackend {
    createChannel(guildId: string, payload: ChannelPayload): Promise<void>;
    // updateChannel?
    // deleteChannel?
}

export interface MessageBackend {
    createMessage(
        target: MessageTarget,
        payload: MessagePayload,
    ): Promise<void>;
    updateMessage(ref: MessageRef, payload: MessagePayload): Promise<void>;
    deleteMessage(ref: MessageRef): Promise<void>;
}

export interface Backend
    extends
        SessionBackend,
        RealtimeBackend,
        GuildBackend,
        ChannelBackend,
        MessageBackend {}
