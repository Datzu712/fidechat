import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Logger, type OnModuleDestroy, type OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { type ConnectedUser, type ServerToClientEvents, SocketEvents } from '@fidechat/shared';
import { IAUserModels } from '../ai/ai-command.service.js';
import { TokenVerifier } from '../auth/token-verifier.service.js';
import { SessionService } from '../auth/session/session.service.js';
import { readCookie, SESSION_COOKIE } from '../auth/session/cookie.util.js';
import { parseStatusUpdate } from './status-update.util.js';

const sessionRoom = (sid: string) => `session:${sid}`;
/** setTimeout's upper bound (~24.8 days). */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

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
    readonly #activeUsers = new Map<string, Omit<ConnectedUser, 'userId'>>();

    /**
     * Retrieves a list of active users and their statuses.
     * Converts the internal map of active users into an array of objects,
     * where each object contains the user ID and their corresponding status.
     *
     * @returns An array of objects, each containing:
     * - `userId`: The unique identifier of the user.
     * - `status`: The current status of the user.
     */
    get activeUsers(): ConnectedUser[] {
        return Array.from(this.#activeUsers.entries()).map(([userId, data]) => ({
            ...data,
            userId,
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
                status: 'online',
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
            status: 'online',
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

    public emitToUser<E extends keyof ServerToClientEvents>(
        userId: string,
        event: E,
        ...args: Parameters<ServerToClientEvents[E]>
    ) {
        this.server.to(userId).emit(event, ...args);
    }

    public emitForceSync(userId: string) {
        this.server.to(userId).emit(SocketEvents.FORCE_SYNC);
    }

    public emitToUsers<E extends keyof ServerToClientEvents>(
        userIds: string[],
        event: E,
        ...args: Parameters<ServerToClientEvents[E]>
    ) {
        if (!userIds.length) {
            this.logger.error('User IDs are required to emit to users!');
            return;
        }

        this.logger.debug(`Emitting event ${event} to users: ${userIds.join(', ')}`);

        userIds.forEach((userId) => {
            this.server.to(userId).emit(event, ...args);
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

    public handleUserStatusUpdate(socket: SocketClient, data: unknown) {
        const userId = socket.data.user?.sub;
        if (!userId) {
            socket.disconnect();
            return;
        }

        const update = parseStatusUpdate(data);
        if (!update) {
            this.logger.warn(`Dropped an invalid status update from user ${userId}`);
            return;
        }

        const current = this.#activeUsers.get(userId);
        if (current) {
            this.#activeUsers.set(userId, { ...current, ...update });
            this.server.emit(SocketEvents.USER_STATUS_UPDATE, this.activeUsers);
        }
    }

    public onModuleInit() {
        this.server.on('connection', (socket: SocketClient) => {
            socket.on(SocketEvents.UPDATE_CURRENT_STATUS, (data) => {
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
            status: 'online',
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
            status: 'online',
            isTyping: false,
            typingInChannel: undefined,
        });

        this.server.emit(SocketEvents.USER_STATUS_UPDATE, this.activeUsers);
    }
}
