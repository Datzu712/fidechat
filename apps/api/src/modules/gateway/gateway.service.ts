import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Logger, type OnModuleDestroy, type OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { IAUserModels } from '../ai/ai-command.service';
import { TokenVerifier } from '../auth/token-verifier.service';
import { SessionService } from '../auth/session/session.service';
import { readCookie, SESSION_COOKIE } from '../auth/session/cookie.util';

const sessionRoom = (sid: string) => `session:${sid}`;
/** setTimeout's upper bound (~24.8 days). */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

export enum SocketEvents {
    GUILD_CREATE = 'guildCreate',
    CHANNEL_CREATE = 'channelCreate',
    MESSAGE_CREATE = 'messageCreate',
    MESSAGE_UPDATE = 'messageUpdate',
    MESSAGE_DELETE = 'messageDelete',
    MEMBER_ADD = 'memberAdd',
    FORCE_SYNC = 'forceSync',
    USER_STATUS_UPDATE = 'userStatusUpdate',
    UPDATE_CURRENT_STATUS = 'updateCurrentClientStatus', // client -> server
}
export type SocketUserStatus = 'online' | 'idle' | 'dnd';
export enum SocketUserStatusEnum {
    ONLINE = 'online',
    IDLE = 'idle',
    DND = 'dnd',
    OFFLINE = 'offline',
}

export interface SocketUserMetadata {
    userId: string;
    status: SocketUserStatus;
    typingInChannel?: string;
    isTyping: boolean;
}

@WebSocketGateway({
    namespace: process.env.SOCKET_NAMESPACE,
    serveClient: false,
    transports: ['websocket'],
    allowUpgrades: true,
})
export class GatewayService
    implements OnGatewayInit, OnGatewayConnection, OnModuleDestroy, OnGatewayDisconnect, OnModuleInit
{
    private readonly logger = new Logger('GatewayService');
    readonly #activeUsers = new Map<string, Omit<SocketUserMetadata, 'userId'>>();

    /**
     * Retrieves a list of active users and their statuses.
     * Converts the internal map of active users into an array of objects,
     * where each object contains the user ID and their corresponding status.
     *
     * @returns An array of objects, each containing:
     * - `userId`: The unique identifier of the user.
     * - `status`: The current status of the user.
     */
    get activeUsers(): SocketUserMetadata[] {
        return Array.from(this.#activeUsers.entries()).map(([userId, data]) => ({
            userId,
            ...data,
        }));
    }

    @WebSocketServer()
    public server!: SocketServer;

    constructor(
        private readonly tokenVerifier: TokenVerifier,
        private readonly sessions: SessionService,
    ) {
        this.logger.log('Initializing WebSocket Gateway...');

        for (const user of IAUserModels) {
            this.#activeUsers.set(user.id, {
                status: SocketUserStatusEnum.ONLINE,
                isTyping: false,
            });
        }
    }

    /**
     * Authenticates every handshake before Socket.IO accepts it: a refused client gets `connect_error`
     * and never a `connect`. Logging out closes that session's sockets.
     */
    public afterInit(server: SocketServer) {
        server.use((socket, next) => {
            this.authenticate(socket).then(
                (user) => {
                    socket.data.user = user;
                    next();
                },
                (error: unknown) => next(error as Error), // authenticate() only throws Errors
            );
        });
        this.sessions.events.on('ended', (sid: string) => {
            this.server.in(sessionRoom(sid)).disconnectSockets();
        });
    }

    private async authenticate(socket: SocketClient): Promise<IReqUser> {
        const { origin } = socket.handshake.headers;
        if (!this.sessions.isAllowedOrigin(origin)) {
            this.logger.error(`${socket.handshake.address} tried to connect from origin ${origin}`);
            throw new Error('Origin not allowed');
        }

        // The client only sees a fixed reason: `Service unavailable` (Keycloak down, retry later) or
        // `Unauthorized` (log in again).
        try {
            const token = await this.getAccessTokenFromSocket(socket);
            if (!token) throw new Error('No token');
            return await this.tokenVerifier.offline(token);
        } catch (error) {
            this.logger.error(`${socket.handshake.address} handshake refused: ${String(error)}`);
            throw new Error(error instanceof ServiceUnavailableException ? 'Service unavailable' : 'Unauthorized');
        }
    }

    /** Only authenticated sockets get here (see `afterInit`). */
    public handleConnection(socket: SocketClient) {
        const user = socket.data.user!;

        void socket.join(user.sub);
        const sid = readCookie(socket.handshake.headers.cookie, SESSION_COOKIE);
        if (sid) void socket.join(sessionRoom(sid));

        // The token is only checked at the handshake: close the socket when it expires, so the client
        // reconnects and is checked again (the session refreshes the token).
        const expiry = setTimeout(() => socket.disconnect(), Math.min(user.exp * 1000 - Date.now(), MAX_TIMEOUT_MS));
        socket.once('disconnect', () => clearTimeout(expiry));

        this.#activeUsers.set(user.sub, {
            status: SocketUserStatusEnum.ONLINE,
            isTyping: false,
        });
        this.server.emit(SocketEvents.USER_STATUS_UPDATE, this.activeUsers);

        this.logger.debug(
            `Socket ${socket.id} connected with user data: ${JSON.stringify(socket.data.user)} (${socket.handshake.address} - socket: ${socket.id})`,
        );
        socket.emit('welcome', `Hi ${user.sub}, welcome to Fidechat!`);
    }

    /**
     * The token comes from the session cookie (`SessionService.resolveAccessToken`); only outside
     * production `auth.token` or the `access-token` header (Postman) are read.
     */
    private async getAccessTokenFromSocket(socket: SocketClient): Promise<string | undefined> {
        return this.sessions.resolveAccessToken(socket.handshake.headers.cookie, () => {
            const authToken: unknown = socket.handshake.auth.token;
            const header = socket.handshake.headers['access-token'];
            if (typeof authToken === 'string') return authToken;
            return typeof header === 'string' ? header : undefined;
        });
    }

    public emitToUser(userId: string, event: keyof ServerToClientEvents, data: any) {
        this.server.to(userId).emit(event, data);
    }

    public emitForceSync(userId: string) {
        this.server.to(userId).emit(SocketEvents.FORCE_SYNC);
    }

    public emitToUsers(userIds: string[], event: keyof ServerToClientEvents, data: any) {
        if (!userIds.length) {
            this.logger.error('User IDs are required to emit to users!');
            return;
        }

        this.logger.debug(`Emitting event ${event} to users: ${userIds.join(', ')}`);

        userIds.forEach((userId) => {
            this.server.to(userId).emit(event, data);
        });
    }

    public handleDisconnect(socket: SocketClient) {
        this.logger.debug(`Socket ${socket.id} disconnected.`);
        if (socket.data.user) {
            const userId = socket.data.user.sub;
            if (typeof userId === 'string' && this.#activeUsers.has(userId)) {
                this.#activeUsers.delete(userId);
                this.server.emit(SocketEvents.USER_STATUS_UPDATE, this.activeUsers);
            }
        }
    }

    public onModuleDestroy() {
        void this.server.close();
        this.logger.log('WebSocket server closed...');
    }

    public handleUserStatusUpdate(socket: SocketClient, metadata: SocketUserMetadata) {
        if (!socket.data.user) {
            socket.disconnect();
            return;
        }

        if (socket.data.user.sub && this.#activeUsers.has(socket.data.user.sub)) {
            const currentData = this.#activeUsers.get(socket.data.user.sub)!;
            this.#activeUsers.set(socket.data.user.sub, Object.assign(currentData, metadata));

            this.server.emit(SocketEvents.USER_STATUS_UPDATE, this.activeUsers);
        }
    }

    public onModuleInit() {
        this.server.on('connection', (socket: SocketClient) => {
            socket.on(SocketEvents.UPDATE_CURRENT_STATUS, (data: SocketUserMetadata) => {
                this.logger.debug(`User ${socket.id} updated status to: ${JSON.stringify(data)}`);

                this.handleUserStatusUpdate(socket, data);
            });
        });
    }

    public startTypingIA(modelId: string, channelId: string) {
        const user = IAUserModels.find((user) => user.id === modelId);
        if (!user) {
            this.logger.error(`IA user with ID ${modelId} not found`);
            return;
        }

        this.#activeUsers.set(user.id, {
            status: SocketUserStatusEnum.ONLINE,
            isTyping: true,
            typingInChannel: channelId,
        });

        this.server.emit(SocketEvents.USER_STATUS_UPDATE, this.activeUsers);
        this.server.to(channelId).emit(SocketEvents.USER_STATUS_UPDATE, this.activeUsers);
    }

    public stopTypingIA(modelId: string) {
        const user = IAUserModels.find((user) => user.id === modelId);
        if (!user) {
            this.logger.error(`IA user with ID ${modelId} not found`);
            return;
        }

        this.#activeUsers.set(user.id, {
            status: SocketUserStatusEnum.ONLINE,
            isTyping: false,
            typingInChannel: undefined,
        });

        this.server.emit(SocketEvents.USER_STATUS_UPDATE, this.activeUsers);
    }
}
