import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { TokenVerifier } from '../auth/token-verifier.service.js';
import { SessionService } from '../auth/session/session.service.js';

/** Checks a Socket.IO handshake: an allowed origin and a valid access token. */
@Injectable()
export class HandshakeAuthenticator {
    private readonly logger = new Logger(HandshakeAuthenticator.name);

    constructor(
        private readonly tokenVerifier: TokenVerifier,
        private readonly sessions: SessionService,
    ) {}

    public async authenticate(socket: SocketClient): Promise<IReqUser> {
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
}
