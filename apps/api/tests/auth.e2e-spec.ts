import 'dotenv/config';

import { generateKeyPairSync } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { Test, type TestingModule } from '@nestjs/testing';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/modules/app.module';
import { KeycloakClient } from '@/infrastructure/keycloak';
import { VersioningType } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import jwt from 'jsonwebtoken';
import { io, type Socket } from 'socket.io-client';

/** Resolves with `welcome` when the gateway accepts the socket, or `disconnected` when it drops it. */
async function socketOutcome(socket: Socket): Promise<'welcome' | 'disconnected'> {
    // oxlint-disable-next-line promise/avoid-new -- socket.io-client only exposes callbacks
    return new Promise((resolve) => {
        socket.on('welcome', () => resolve('welcome'));
        socket.on('disconnect', () => resolve('disconnected'));
        socket.on('connect_error', () => resolve('disconnected'));
    });
}

describe('Keycloak Authentication E2E', () => {
    let app: NestFastifyApplication;

    // Keycloak test configuration
    const KEYCLOAK_CONFIG = {
        url: process.env.PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
        realm: process.env.KEYCLOAK_REALM || 'fidechat',
        clientId: process.env.KEYCLOAK_CLIENT_ID || 'fidechat',
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'KxRu3hfJM4f9rDZXFhbOKQq4FenlrdIk',
        adminUsername: process.env.KEYCLOAK_ADMIN || 'admin',
        adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    };

    const keycloakClient = new KeycloakClient({
        url: KEYCLOAK_CONFIG.url,
        realm: KEYCLOAK_CONFIG.realm,
        clientId: KEYCLOAK_CONFIG.clientId,
        clientSecret: KEYCLOAK_CONFIG.clientSecret,
        adminUsername: KEYCLOAK_CONFIG.adminUsername,
        adminPassword: KEYCLOAK_CONFIG.adminPassword,
    });

    // Test user credentials
    const TEST_USER = {
        username: 'test-user-e2e',
        email: 'test-e2e@fidechat.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
    };

    let testUserId: string;
    let userAccessToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        app.useWebSocketAdapter(new IoAdapter(app));

        app.enableVersioning({
            type: VersioningType.URI,
            prefix: 'v',
        });
        app.enableShutdownHooks();
        app.setGlobalPrefix('api');

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
        await app.listen(0);
        await keycloakClient.connect();

        testUserId = await keycloakClient.createUser(TEST_USER);
    });

    afterAll(async () => {
        try {
            if (testUserId && userAccessToken) {
                await keycloakClient.deleteUser(testUserId);
            }

            await app.close();
        } catch (error) {
            console.error('Error cleaning up test user:', error);
        }
    });

    describe('User authentication via Keycloak', () => {
        it('should be able to reach Keycloak server', async () => {
            const user = await keycloakClient.findUserByUsername(TEST_USER.username);
            expect(user).toBeDefined();
            expect(user?.username).toBe(TEST_USER.username);

            const tokenResponse = await keycloakClient.getUserToken(TEST_USER.username, TEST_USER.password);
            expect(tokenResponse.access_token).toBeDefined();
            expect(tokenResponse.refresh_token).toBeDefined();

            userAccessToken = tokenResponse.access_token;
        });
    });

    describe('Protected Endpoints', () => {
        it('should reject requests without authentication token', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/@me/sync',
            });

            expect(response.statusCode).toBe(401);
        });

        it('should reject requests with invalid token', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/@me/sync',
                headers: {
                    authorization: 'Bearer invalid-token-here',
                },
            });

            expect(response.statusCode).toBe(401);
        });

        it('should allow requests with valid token', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/@me/sync',
                headers: {
                    authorization: `Bearer ${userAccessToken}`,
                },
            });

            expect([200, 201, 204]).toContain(response.statusCode);
        });

        it('should allow access to public endpoints without token', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/guilds/public',
                headers: {
                    authorization: `Bearer ${userAccessToken}`,
                },
            });

            expect([200, 201, 204]).toContain(response.statusCode);
        });
    });
    describe('Token verification', () => {
        let accessToken: string;
        let idToken: string;

        /** Opens a socket with the given handshake token and reports whether the gateway accepted it. */
        async function connectWith(token: string) {
            const { port } = app.getHttpServer().address() as AddressInfo;
            const socket = io(`http://localhost:${port}`, {
                transports: ['websocket'],
                auth: { token },
                reconnection: false,
            });
            const outcome = await socketOutcome(socket);
            socket.disconnect();
            return outcome;
        }

        async function getSync(token: string) {
            return app.inject({
                method: 'GET',
                url: '/api/v1/users/@me/sync',
                headers: { authorization: `Bearer ${token}` },
            });
        }

        beforeAll(async () => {
            const tokens = await keycloakClient.getUserToken(TEST_USER.username, TEST_USER.password);
            accessToken = tokens.access_token;
            idToken = tokens.id_token!;
        });

        it('should reject an ID token used as a bearer token', async () => {
            expect((await getSync(idToken)).statusCode).toBe(401);
        });

        it('should reject a token re-signed with another key', async () => {
            const { header, payload } = jwt.decode(accessToken, { complete: true })!;
            const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
            const forged = jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: header.kid });

            expect((await getSync(forged)).statusCode).toBe(401);
        });

        it('should reject an unsigned token', async () => {
            const unsigned = jwt.sign(jwt.decode(accessToken) as jwt.JwtPayload, '', { algorithm: 'none' });

            expect((await getSync(unsigned)).statusCode).toBe(401);
        });

        it('should accept the access token on the socket handshake', async () => {
            expect(await connectWith(accessToken)).toBe('welcome');
        });

        it('should reject an ID token on the socket handshake', async () => {
            expect(await connectWith(idToken)).toBe('disconnected');
        });
    });
});
