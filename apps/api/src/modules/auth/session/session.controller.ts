import { Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedUser, Public } from '../auth.decorators';
import { LOGIN_TTL_SECONDS, SessionService } from './session.service';
import { LOGIN_STATE_COOKIE, readCookie, SESSION_COOKIE, serializeCookie } from './cookie.util';

const AUTH_PATH = '/api/v1/auth';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

@Controller({ version: '1', path: '/auth' })
export class SessionController {
    constructor(
        private readonly sessions: SessionService,
        private readonly config: ConfigService<IEnvironmentVariables>,
    ) {}

    @Public()
    @Get('login')
    login(@Res() reply: FastifyReply) {
        const { state, redirectUrl } = this.sessions.startAuthCodeFlow();
        return reply
            .header(
                'set-cookie',
                serializeCookie(LOGIN_STATE_COOKIE, state, LOGIN_TTL_SECONDS, AUTH_PATH, this.sessions.isProduction),
            )
            .redirect(redirectUrl, 302);
    }

    /**
     * Keycloak redirects here after login. Any failure (the user cancelled, a stale or forged state,
     * an unexpected issuer, a failed code exchange) sends the browser back to the web app with a
     * `login_error` query parameter instead of an API error page.
     */
    @Public()
    @Get('callback')
    async callback(
        @Req() request: FastifyRequest,
        @Res() reply: FastifyReply,
        @Query('code') code?: string,
        @Query('state') state?: string,
        @Query('iss') iss?: string,
        @Query('error') error?: string,
    ) {
        const clearState = serializeCookie(LOGIN_STATE_COOKIE, '', 0, AUTH_PATH, this.sessions.isProduction);
        const expectedState = readCookie(request.headers.cookie, LOGIN_STATE_COOKIE);
        const webUrl: string = this.config.getOrThrow('PUBLIC_WEB_URL');

        let sid: string | undefined;
        if (!error && code && state && state === expectedState) {
            sid = await this.sessions.finishAuthCodeFlow(code, state, iss).catch(() => undefined);
        }

        if (!sid) {
            const url = new URL(webUrl);
            // Keycloak's error codes are lowercase snake_case; anything else is not echoed back.
            url.searchParams.set('login_error', error && /^[a-z_]+$/.test(error) ? error : 'login_failed');
            return reply.header('set-cookie', clearState).redirect(url.toString(), 302);
        }

        return reply
            .header('set-cookie', [
                clearState,
                serializeCookie(SESSION_COOKIE, sid, SESSION_MAX_AGE, '/', this.sessions.isProduction),
            ])
            .redirect(webUrl, 302);
    }

    /** Returns the Keycloak end-session URL; the web app navigates there to end the SSO session too. */
    @Public()
    @Post('logout')
    @HttpCode(200)
    logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
        const url = this.sessions.logout(readCookie(request.headers.cookie, SESSION_COOKIE));
        void reply.header('set-cookie', serializeCookie(SESSION_COOKIE, '', 0, '/', this.sessions.isProduction));
        return { url };
    }

    /** The caller's identity, or 401 without a session: the web app's "am I logged in?" check. */
    @Get('me')
    me(@AuthenticatedUser() user: IReqUser) {
        return { sub: user.sub, name: user.name, username: user.preferred_username, email: user.email };
    }
}
