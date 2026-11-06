import 'dotenv/config';
import './helpers/production-env';

import type { AddressInfo } from 'node:net';
import { Test, type TestingModule } from '@nestjs/testing';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { io, type Socket } from 'socket.io-client';

import { AppModule } from '../src/modules/app.module';
import { KeycloakClient } from '@/infrastructure/keycloak';

/** Resolves with `welcome` when the gateway accepts the socket, or `disconnected` when it drops it. */
async function socketOutcome(socket: Socket): Promise<'welcome' | 'disconnected'> {
    // oxlint-disable-next-line promise/avoid-new -- socket.io-client only exposes callbacks
    return new Promise((resolve) => {
        socket.on('welcome', () => resolve('welcome'));
        socket.on('disconnect', () => resolve('disconnected'));
        socket.on('connect_error', () => resolve('disconnected'));
    });
}

describe('Production accepts only the session cookie E2E', () => {
    let app: NestFastifyApplication;
    let testUserId: string | undefined;
    let accessToken: string;

    const keycloakClient = new KeycloakClient({
        url: process.env.PUBLIC_KEYCLOAK_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
        adminUsername: process.env.KEYCLOAK_ADMIN,
        adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD,
    });

    const TEST_USER = {
        username: 'production-auth-user-e2e',
        email: 'production-auth-e2e@fidechat.com',
        password: 'TestPassword123!',
        firstName: 'Production',
        lastName: 'Tester',
    };

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
        accessToken = (await keycloakClient.getUserToken(TEST_USER.username, TEST_USER.password)).access_token;
    });

    afterAll(async () => {
        if (testUserId) await keycloakClient.deleteUser(testUserId);
        await app.close();
    });

    it('should reject a valid bearer token on REST endpoints', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/users/@me/sync',
            headers: { authorization: `Bearer ${accessToken}` },
        });

        expect(response.statusCode).toBe(401);
    });

    it('should reject a valid token in the socket handshake', async () => {
        const { port } = app.getHttpServer().address() as AddressInfo;
        const socket = io(`http://localhost:${port}`, {
            transports: ['websocket'],
            auth: { token: accessToken },
            // The web app's origin, so the socket is refused for the token and not for the origin.
            extraHeaders: { 'access-token': accessToken, origin: new URL(process.env.PUBLIC_WEB_URL).origin },
            reconnection: false,
        });

        const outcome = await socketOutcome(socket);
        socket.disconnect();

        expect(outcome).toBe('disconnected');
    });
});
