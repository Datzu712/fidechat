import { createHash, randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import {
    Injectable,
    type OnModuleDestroy,
    type OnModuleInit,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@/common/logger';
import { readCookie, SESSION_COOKIE } from './cookie.util';
import { TokenVerifier } from '../token-verifier.service';

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    id_token?: string;
    expires_in: number;
    refresh_expires_in: number;
}

interface Session {
    accessToken: string;
    refreshToken: string;
    idToken?: string;
    expiresAt: number;
    refreshExpiresAt: number;
}

interface PendingLogin {
    verifier: string;
    expiresAt: number;
}

export const LOGIN_TTL_SECONDS = 10 * 60;
const REFRESH_MARGIN_MS = 30 * 1000;
const SWEEP_INTERVAL_MS = 60 * 1000;

/**
 * BFF sessions: the browser only holds an opaque session id cookie and the
 * Keycloak tokens stay here. Kept in memory, like presence, so it assumes a single API instance
 * and a restart logs everyone out.
 *
 * Note: Currently the session is stored in memory instead of a database or cache, which means that if the server restarts, all sessions will be lost.
 * This decision was made for simplicity because this is just a small project so theres no need to overcomplicate things.
 */
@Injectable()
export class SessionService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger('SessionService');
    readonly #sessions = new Map<string, Session>();
    readonly #pendingLogins = new Map<string, PendingLogin>();
    readonly #refreshing = new Map<string, Promise<string | undefined>>();
    #sweepTimer?: NodeJS.Timeout;
    /** Emits `ended` with the sid when a user logs out, so the gateway can close that session's sockets. */
    readonly events = new EventEmitter();
    readonly isProduction: boolean;
    /** The only origin allowed to use the session cookie (`PUBLIC_WEB_URL`). */
    readonly webOrigin: string;

    constructor(
        private readonly config: ConfigService<IEnvironmentVariables>,
        private readonly tokenVerifier: TokenVerifier,
    ) {
        this.isProduction = this.config.get('NODE_ENV') === 'production';
        this.webOrigin = new URL(this.config.getOrThrow<string>('PUBLIC_WEB_URL')).origin;
    }

    private realmUrl(base: 'KEYCLOAK_URL' | 'PUBLIC_KEYCLOAK_URL') {
        return `${this.config.getOrThrow(base)}/realms/${this.config.getOrThrow('KEYCLOAK_REALM')}/protocol/openid-connect`;
    }

    /**
     * Cookie-authenticated requests and sockets must come from the web app (CSRF and cross-site
     * WebSocket hijacking). Browsers always send `Origin` there; a missing one is only accepted
     * outside production (e2e tests, Postman).
     */
    isAllowedOrigin(origin: string | undefined): boolean {
        return origin === undefined ? !this.isProduction : origin === this.webOrigin;
    }

    startAuthCodeFlow() {
        const state = randomBytes(16).toString('base64url');
        const verifier = randomBytes(32).toString('base64url');
        this.#pendingLogins.set(state, { verifier, expiresAt: Date.now() + LOGIN_TTL_SECONDS * 1000 });

        const redirectUrl = new URL(`${this.realmUrl('PUBLIC_KEYCLOAK_URL')}/auth`);
        redirectUrl.search = new URLSearchParams({
            client_id: this.config.getOrThrow('KEYCLOAK_CLIENT_ID'),
            response_type: 'code',
            scope: 'openid',
            redirect_uri: this.config.getOrThrow('AUTH_CALLBACK_URL'),
            state,
            // PKCE...
            code_challenge: createHash('sha256').update(verifier).digest('base64url'),
            code_challenge_method: 'S256',
        }).toString();

        return { state, redirectUrl: redirectUrl.toString() };
    }

    async finishAuthCodeFlow(code: string, state: string, iss: string | undefined): Promise<string> {
        const pending = this.#pendingLogins.get(state);
        this.#pendingLogins.delete(state);
        if (!pending || pending.expiresAt < Date.now()) {
            throw new UnauthorizedException('Login expired or unknown');
        }
        // RFC 9207: the code must come from our Keycloak realm, which rules out mix-up attacks.
        if (iss !== this.tokenVerifier.issuer) {
            throw new UnauthorizedException('Unexpected issuer');
        }

        const tokens = await this.requestTokens({
            grant_type: 'authorization_code',
            code,
            code_verifier: pending.verifier,
            redirect_uri: this.config.getOrThrow('AUTH_CALLBACK_URL'),
        });
        if (!tokens) throw new UnauthorizedException('Code exchange failed');

        const sid = randomBytes(32).toString('base64url');
        this.#sessions.set(sid, this.toSession(tokens));

        return sid;
    }

    async getAccessToken(sid: string): Promise<string | undefined> {
        const session = this.#sessions.get(sid);
        if (!session) return undefined;
        if (Date.now() < session.expiresAt - REFRESH_MARGIN_MS) return session.accessToken;
        if (Date.now() >= session.refreshExpiresAt) {
            this.#sessions.delete(sid);
            return undefined;
        }

        // Requests that arrive together after expiry share one refresh instead of each calling Keycloak.
        let refresh = this.#refreshing.get(sid);
        if (!refresh) {
            refresh = this.refresh(sid, session).finally(() => this.#refreshing.delete(sid));
            this.#refreshing.set(sid, refresh);
        }
        return refresh;
    }

    /**
     * The credential rule for REST and the socket: the access token always comes from the session
     * cookie. Only outside production, when there is no session, `readDevToken` is called to take a
     * token sent by the client (e2e tests, Postman); in production client headers are never read.
     */
    async resolveAccessToken(cookieHeader: string | undefined, readDevToken: () => string | undefined) {
        const sid = readCookie(cookieHeader, SESSION_COOKIE);
        const token = sid ? await this.getAccessToken(sid) : undefined;
        if (token) return token;
        return this.isProduction ? undefined : readDevToken() || undefined;
    }

    /** Ends the local session and returns the Keycloak URL that ends the SSO session. */
    logout(sid: string | undefined): string {
        const session = sid ? this.#sessions.get(sid) : undefined;
        if (sid) {
            this.#sessions.delete(sid);
            this.events.emit('ended', sid);
        }

        const url = new URL(`${this.realmUrl('PUBLIC_KEYCLOAK_URL')}/logout`);
        url.search = new URLSearchParams({
            client_id: this.config.getOrThrow('KEYCLOAK_CLIENT_ID'),
            post_logout_redirect_uri: this.config.getOrThrow('PUBLIC_WEB_URL'),
            ...(session?.idToken ? { id_token_hint: session.idToken } : {}),
        }).toString();
        return url.toString();
    }

    private async refresh(sid: string, session: Session): Promise<string | undefined> {
        const tokens = await this.requestTokens({ grant_type: 'refresh_token', refresh_token: session.refreshToken });
        // A logout (or another refresh) may have replaced the session while Keycloak answered: never resurrect it.
        if (this.#sessions.get(sid) !== session) return undefined;
        if (!tokens) {
            this.#sessions.delete(sid);
            return undefined;
        }

        const refreshed = this.toSession(tokens);
        refreshed.idToken ??= session.idToken;
        this.#sessions.set(sid, refreshed);
        return refreshed.accessToken;
    }

    private async requestTokens(params: Record<string, string>): Promise<TokenResponse | undefined> {
        // Keycloak unreachable or failing (5xx) is a 503 and keeps the session; a 4xx (for example an
        // expired refresh token) means the grant is invalid.
        let response: Response;
        try {
            response = await fetch(`${this.realmUrl('KEYCLOAK_URL')}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: this.config.getOrThrow('KEYCLOAK_CLIENT_ID'),
                    client_secret: this.config.getOrThrow('KEYCLOAK_CLIENT_SECRET'),
                    ...params,
                }),
            });
        } catch (error) {
            this.logger.error(`Keycloak unreachable: ${String(error)}`);
            throw new ServiceUnavailableException('Keycloak is unavailable');
        }
        if (response.status >= 500) {
            this.logger.error(`Keycloak ${params.grant_type} failed: ${response.status}`);
            throw new ServiceUnavailableException('Keycloak is unavailable');
        }
        if (!response.ok) {
            this.logger.warn(`Keycloak ${params.grant_type} failed: ${response.status} ${await response.text()}`);
            return undefined;
        }

        const tokens = (await response.json()) as TokenResponse;
        try {
            await this.verifyTokens(tokens, params.grant_type === 'authorization_code');
        } catch (error) {
            if (!(error instanceof UnauthorizedException)) throw error;
            this.logger.warn(`Rejected tokens from Keycloak ${params.grant_type}: ${error.message}`);
            return undefined;
        }
        return tokens;
    }

    /**
     * Checks the tokens before trusting them: the access token with the same rules as every request
     * plus its client binding, and the ID token for this client. The ID token is required on login,
     * and checked on refresh only when Keycloak returns one.
     */
    private async verifyTokens(tokens: TokenResponse, requireIdToken: boolean) {
        const clientId: string = this.config.getOrThrow('KEYCLOAK_CLIENT_ID');

        const access = await this.tokenVerifier.offline(tokens.access_token);
        if (access.azp !== clientId) throw new UnauthorizedException(`Access token issued to ${access.azp}`);

        if (!tokens.id_token) {
            if (requireIdToken) throw new UnauthorizedException('Missing ID token');
            return;
        }
        await this.tokenVerifier.idToken(tokens.id_token, clientId);
    }

    private toSession(tokens: TokenResponse): Session {
        const now = Date.now();
        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
            expiresAt: now + tokens.expires_in * 1000,
            // Keycloak sends 0 when the refresh token has no idle expiry (e.g. offline tokens).
            refreshExpiresAt: tokens.refresh_expires_in ? now + tokens.refresh_expires_in * 1000 : Infinity,
        };
    }

    onModuleInit() {
        this.#sweepTimer = setInterval(() => this.removeExpired(), SWEEP_INTERVAL_MS);
        this.#sweepTimer.unref();
    }

    onModuleDestroy() {
        clearInterval(this.#sweepTimer);
    }

    /** Drops abandoned logins and sessions whose refresh token can no longer be used. */
    private removeExpired() {
        const now = Date.now();
        for (const [state, pending] of this.#pendingLogins) {
            if (pending.expiresAt < now) this.#pendingLogins.delete(state);
        }
        for (const [sid, session] of this.#sessions) {
            if (session.refreshExpiresAt < now) this.#sessions.delete(sid);
        }
    }
}
