import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Logger, type OnModuleDestroy } from '@nestjs/common';
import { SocketEvents } from '@fidechat/shared';
import { SessionService } from '../auth/session/session.service.js';
import { readCookie, SESSION_COOKIE } from '../auth/session/cookie.util.js';
import { HandshakeAuthenticator } from './handshake-authenticator.js';
import { PresenceService } from './presence.service.js';
import { SocketEmitter } from './socket-emitter.js';

const sessionRoom = (sid: string) => `session:${sid}`;
/** setTimeout's upper bound (~24.8 days). */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * The socket lifecycle. Inbound events are plain `socket.on` listeners, not `@SubscribeMessage`: Nest
 * would run the global `AuthGuard` and `KeycloakSyncInterceptor` on those, and both assume HTTP.
 */
@WebSocketGateway({
    namespace: process.env.SOCKET_NAMESPACE,
    serveClient: false,
    transports: ['websocket'],
    allowUpgrades: true,
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
    private readonly logger = new Logger(SocketGateway.name);

    @WebSocketServer()
    public server!: SocketServer;

    constructor(
        private readonly authenticator: HandshakeAuthenticator,
        private readonly presence: PresenceService,
        private readonly emitter: SocketEmitter,
        private readonly sessions: SessionService,
    ) {
        this.logger.log('Initializing WebSocket Gateway...');
    }

    /**
     * Authenticates every handshake before Socket.IO accepts it: a refused client gets `connect_error`
     * and never a `connect`. Logging out closes that session's sockets.
     */
    public afterInit(server: SocketServer) {
        this.emitter.attach(server);

        server.use((socket, next) => {
            this.authenticator.authenticate(socket).then(
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

        this.presence.setOnline(user.sub);

        this.logger.debug(
            `Socket ${socket.id} connected with user data: ${JSON.stringify(socket.data.user)} (${socket.handshake.address} - socket: ${socket.id})`,
        );
        socket.emit('welcome', `Hi ${user.sub}, welcome to Fidechat!`);

        socket.on(SocketEvents.UPDATE_CURRENT_STATUS, (data) => {
            this.logger.debug(`User ${socket.id} updated status to: ${JSON.stringify(data)}`);

            this.presence.update(user.sub, data);
        });
    }

    public handleDisconnect(socket: SocketClient) {
        this.logger.debug(`Socket ${socket.id} disconnected.`);
        if (socket.data.user) {
            this.presence.setOffline(socket.data.user.sub);
        }
    }

    public onModuleDestroy() {
        void this.server.close();
        this.logger.log('WebSocket server closed...');
    }
}
