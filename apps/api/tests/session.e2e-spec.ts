import 'dotenv/config';

import type { AddressInfo } from 'node:net';
import { Test, type TestingModule } from '@nestjs/testing';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { LightMyRequestResponse } from 'fastify';
import { io } from 'socket.io-client';

import { AppModule } from '../src/modules/app.module';
import { KeycloakClient } from '@/infrastructure/keycloak';
import { LOGIN_STATE_COOKIE, SESSION_COOKIE } from '@/modules/auth/session/cookie.util';

/** Returns the `name=value` pair of a cookie the response set, ready to send back in a Cookie header. */
function cookiePair(response: LightMyRequestResponse, name: string): string | undefined {
    const cookie = response.cookies.find((c) => c.name === name);
    return cookie ? `${cookie.name}=${cookie.value}` : undefined;
}

describe('BFF session login E2E', () => {
    let app: NestFastifyApplication;
    let testUserId: string | undefined;

    const keycloakClient = new KeycloakClient({
        url: process.env.PUBLIC_KEYCLOAK_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
        adminUsername: process.env.KEYCLOAK_ADMIN,
        adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD,
    });

    const TEST_USER = {
        username: 'session-test-user-e2e',
        email: 'session-test-e2e@fidechat.com',
        password: 'TestPassword123!',
        firstName: 'Session',
        lastName: 'Tester',
    };

    const FOREIGN_ORIGIN = 'http://localhost:6666';

    /** A failed login sends the browser back to the web app with `login_error` and clears the state cookie. */
    function expectLoginError(response: LightMyRequestResponse, code: string) {
        expect(response.statusCode).toBe(302);
        expect(new URL(response.headers.location!).searchParams.get('login_error')).toBe(code);
        expect(cookiePair(response, LOGIN_STATE_COOKIE)).toBe(`${LOGIN_STATE_COOKIE}=`);
    }

    /** Drives the Keycloak login form the way a browser would and returns the session cookie. */
    async function loginThroughBrowserFlow(): Promise<string> {
        const login = await app.inject({ method: 'GET', url: '/api/v1/auth/login' });
        const stateCookie = cookiePair(login, LOGIN_STATE_COOKIE)!;

        const loginPage = await fetch(login.headers.location!, { redirect: 'manual' });
        const keycloakCookies = loginPage.headers
            .getSetCookie()
            .map((header) => header.split(';')[0])
            .join('; ');
        const action = /action="([^"]*login-actions\/authenticate[^"]*)"/.exec(await loginPage.text())![1];

        const submitted = await fetch(action.replaceAll('&amp;', '&'), {
            method: 'POST',
            redirect: 'manual',
            headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: keycloakCookies },
            body: new URLSearchParams({ username: TEST_USER.username, password: TEST_USER.password }),
        });
        const callbackUrl = new URL(submitted.headers.get('location')!);
        expect(callbackUrl.href.startsWith(process.env.AUTH_CALLBACK_URL)).toBe(true);

        const callback = await app.inject({
            method: 'GET',
            url: `/api/v1/auth/callback${callbackUrl.search}`,
            headers: { cookie: stateCookie },
        });
        expect(callback.statusCode).toBe(302);
        expect(callback.headers.location).toBe(process.env.PUBLIC_WEB_URL);

        return cookiePair(callback, SESSION_COOKIE)!;
    }

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        app.useWebSocketAdapter(new IoAdapter(app));
        app.enableVersioning({ type: VersioningType.URI, prefix: 'v' });
        app.enableShutdownHooks();
        app.setGlobalPrefix('api');

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
        await app.listen(0);

        await keycloakClient.connect();
        testUserId = await keycloakClient.createUser(TEST_USER);
    });

    afterAll(async () => {
        if (testUserId) await keycloakClient.deleteUser(testUserId);
        await app.close();
    });

    it('should redirect to Keycloak with PKCE and bind the state to a cookie', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/v1/auth/login' });

        expect(response.statusCode).toBe(302);
        const location = new URL(response.headers.location!);
        expect(location.pathname).toBe(`/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`);
        expect(location.searchParams.get('code_challenge_method')).toBe('S256');
        expect(location.searchParams.get('redirect_uri')).toBe(process.env.AUTH_CALLBACK_URL);

        const stateCookie = cookiePair(response, LOGIN_STATE_COOKIE);
        expect(stateCookie).toBe(`${LOGIN_STATE_COOKIE}=${location.searchParams.get('state')}`);
    });

    it('should reject a callback whose state does not match the cookie', async () => {
        const login = await app.inject({ method: 'GET', url: '/api/v1/auth/login' });
        const state = new URL(login.headers.location!).searchParams.get('state');

        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/auth/callback?code=whatever&state=${state}`,
            headers: { cookie: `${LOGIN_STATE_COOKIE}=another-state` },
        });

        expectLoginError(response, 'login_failed');
    });

    it('should reject a callback from an unexpected issuer', async () => {
        const login = await app.inject({ method: 'GET', url: '/api/v1/auth/login' });
        const state = new URL(login.headers.location!).searchParams.get('state')!;

        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/auth/callback?${new URLSearchParams({ code: 'whatever', state, iss: 'https://evil.example/realms/fidechat' })}`,
            headers: { cookie: cookiePair(login, LOGIN_STATE_COOKIE)! },
        });

        expectLoginError(response, 'login_failed');
    });

    it('should send the user back to the web app when they cancel the Keycloak login', async () => {
        const login = await app.inject({ method: 'GET', url: '/api/v1/auth/login' });
        const state = new URL(login.headers.location!).searchParams.get('state')!;

        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/auth/callback?${new URLSearchParams({ error: 'access_denied', state })}`,
            headers: { cookie: cookiePair(login, LOGIN_STATE_COOKIE)! },
        });

        expectLoginError(response, 'access_denied');
    });

    it('should reject an unknown session cookie', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/users/@me/sync',
            headers: { cookie: `${SESSION_COOKIE}=unknown` },
        });

        expect(response.statusCode).toBe(401);
    });

    it('should log in, authenticate REST and socket calls with the cookie, and log out', async () => {
        const sessionCookie = await loginThroughBrowserFlow();

        const sync = await app.inject({
            method: 'GET',
            url: '/api/v1/users/@me/sync',
            headers: { cookie: sessionCookie },
        });
        expect(sync.statusCode).toBe(200);

        // Cookie-authenticated writes from another origin are refused (CSRF).
        const foreignWrite = await app.inject({
            method: 'POST',
            url: '/api/v1/guilds',
            headers: { cookie: sessionCookie, origin: FOREIGN_ORIGIN, 'content-type': 'application/json' },
            payload: { name: 'CSRF guild', isPublic: false },
        });
        expect(foreignWrite.statusCode).toBe(403);

        const { port } = app.getHttpServer().address() as AddressInfo;

        // So is a socket opened from another origin (cross-site WebSocket hijacking).
        const foreignSocket = io(`http://localhost:${port}`, {
            transports: ['websocket'],
            extraHeaders: { cookie: sessionCookie, origin: FOREIGN_ORIGIN },
            reconnection: false,
        });
        // oxlint-disable-next-line promise/avoid-new -- socket.io-client only exposes callbacks
        const foreignOutcome = await new Promise<string>((resolve) => {
            foreignSocket.on('welcome', () => resolve('welcome'));
            foreignSocket.on('disconnect', () => resolve('disconnected'));
            foreignSocket.on('connect_error', () => resolve('disconnected'));
        });
        foreignSocket.disconnect();
        expect(foreignOutcome).toBe('disconnected');

        const socket = io(`http://localhost:${port}`, {
            transports: ['websocket'],
            extraHeaders: { cookie: sessionCookie },
            reconnection: false,
        });
        // oxlint-disable-next-line promise/avoid-new -- socket.io-client only exposes callbacks
        const welcome = await new Promise<string>((resolve, reject) => {
            socket.on('welcome', resolve);
            socket.on('disconnect', () => reject(new Error('Socket was disconnected')));
            socket.on('connect_error', reject);
        });
        socket.disconnect();
        expect(welcome).toContain(testUserId);

        const logout = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/logout',
            headers: { cookie: sessionCookie },
        });
        expect(logout.statusCode).toBe(200);
        const endSession = new URL(logout.json<{ url: string }>().url);
        expect(endSession.searchParams.get('id_token_hint')).toBeTruthy();
        expect(cookiePair(logout, SESSION_COOKIE)).toBe(`${SESSION_COOKIE}=`);

        const afterLogout = await app.inject({
            method: 'GET',
            url: '/api/v1/users/@me/sync',
            headers: { cookie: sessionCookie },
        });
        expect(afterLogout.statusCode).toBe(401);
    });
});
