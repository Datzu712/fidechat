/* eslint-disable eslint-comments/require-description -- n */
/* eslint-disable promise/param-names */
/* eslint-disable promise/avoid-new */
/* eslint-disable max-nested-callbacks */
import 'dotenv/config';
import { type Channel, type GuildWithMembers, type Message, SocketEvents } from '@fidechat/shared';
import { VersioningType } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Test, type TestingModule } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';

import { KeycloakClient } from '@/infrastructure/keycloak/index.js';

import { AppModule } from '../src/modules/app.module.js';

describe('Guild Creation E2E', () => {
    let app: NestFastifyApplication;
    let socketClient: Socket;

    const keycloakClient = new KeycloakClient({
        url: process.env.PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
        realm: process.env.KEYCLOAK_REALM || 'fidechat',
        clientId: process.env.KEYCLOAK_CLIENT_ID || 'fidechat',
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'my_crazy_secret',
        adminUsername: process.env.KEYCLOAK_ADMIN || 'admin',
        adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    });

    const TEST_USER = {
        username: 'guild-test-user-e2e',
        email: 'guild-test-e2e@fidechat.com',
        password: 'TestPassword123!',
        firstName: 'Guild',
        lastName: 'Tester',
    };

    const TEST_GUILD = {
        name: 'Test Guild E2E',
        isPublic: true,
        iconUrl: 'https://example.com/icon.png',
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

        await app.listen(process.env.API_PORT || 8081);

        await keycloakClient.connect();

        testUserId = await keycloakClient.createUser(TEST_USER);

        const tokenResponse = await keycloakClient.getUserToken(TEST_USER.username, TEST_USER.password);
        userAccessToken = tokenResponse.access_token;
    });

    afterAll(async () => {
        try {
            if (socketClient.connected) {
                socketClient.disconnect();
            }

            if (testUserId && userAccessToken) {
                await keycloakClient.deleteUser(testUserId);
            }

            await app.close();
        } catch (error) {
            console.error('Error cleaning up test resources:', error);
        }
    });

    afterEach(() => {
        if (socketClient.connected) {
            socketClient.disconnect();
        }
    });

    describe('Guild Creation Flow', () => {
        it('should create a guild and emit socket event to the owner', async () => {
            const socketUrl = `http://localhost:${process.env.API_PORT || 8081}`;

            socketClient = io(socketUrl, {
                auth: {
                    token: userAccessToken,
                },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                transports: ['websocket', 'polling'],
                timeout: 10000,
            });

            await new Promise<void>((resolve, reject) => {
                socketClient.on('connect', () => resolve());
                socketClient.on('connect_error', reject);
            });

            expect(socketClient.connected).toBe(true);

            // Setup promise to capture socket event
            const guildCreateEventPromise = new Promise<any>((resolve) => {
                socketClient.on(SocketEvents.GUILD_CREATE, (data) => {
                    resolve(data);
                });
            });

            // Create guild via HTTP
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/guilds',
                headers: {
                    authorization: `Bearer ${userAccessToken}`,
                    'content-type': 'application/json',
                },
                payload: TEST_GUILD,
            });

            // Verify HTTP response
            expect(response.statusCode).toBe(201);

            // Wait for and verify socket event
            const guildCreateEvent = await Promise.race<GuildWithMembers>([
                guildCreateEventPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Socket event timeout')), 5000)),
            ]);

            // The event carries the full wire shape, including the owner as the only member.
            expect(guildCreateEvent).toEqual({
                id: expect.any(String),
                name: TEST_GUILD.name,
                isPublic: TEST_GUILD.isPublic,
                iconUrl: TEST_GUILD.iconUrl,
                description: null,
                ownerId: testUserId,
                members: [{ userId: testUserId }],
            });
        });

        it('should emit the created channel and message with their wire shapes', async () => {
            socketClient = io(`http://localhost:${process.env.API_PORT || 8081}`, {
                auth: { token: userAccessToken },
                transports: ['websocket'],
            });
            await new Promise<void>((resolve, reject) => {
                socketClient.on('connect', () => resolve());
                socketClient.on('connect_error', reject);
            });

            const nextEvent = async <T>(event: SocketEvents) =>
                Promise.race<T>([
                    new Promise<T>((resolve) => socketClient.once(event, resolve)),
                    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${event} timeout`)), 5000)),
                ]);
            const headers = { authorization: `Bearer ${userAccessToken}`, 'content-type': 'application/json' };

            const guildRes = await app.inject({ method: 'POST', url: '/api/v1/guilds', headers, payload: TEST_GUILD });
            const guildId = guildRes.json<{ id: string }>().id;

            // No description and no position: the event must carry the stored defaults, not the raw body.
            const channelEvent = nextEvent<Channel>(SocketEvents.CHANNEL_CREATE);
            const channelRes = await app.inject({
                method: 'POST',
                url: `/api/v1/guilds/${guildId}/channels`,
                headers,
                payload: { name: 'wire-shape' },
            });
            expect(channelRes.statusCode).toBe(201);
            const channel = await channelEvent;
            expect(channel).toEqual({
                id: expect.any(String),
                name: 'wire-shape',
                description: null,
                position: 0,
                guildId,
            });

            const messageEvent = nextEvent<Message>(SocketEvents.MESSAGE_CREATE);
            const messageRes = await app.inject({
                method: 'POST',
                url: `/api/v1/guilds/${guildId}/channels/${channel.id}/messages`,
                headers,
                payload: { content: 'hello' },
            });
            expect(messageRes.statusCode).toBe(201);
            const message = await messageEvent;
            expect(message).toEqual({
                id: expect.any(String),
                content: 'hello',
                authorId: testUserId,
                channelId: channel.id,
                createdAt: expect.any(String),
            });
            // ISO 8601 in UTC, so every client parses the same instant.
            expect(new Date(message.createdAt).toISOString()).toBe(message.createdAt);
        });

        it('should reject guild creation without authentication', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/guilds',
                headers: {
                    'content-type': 'application/json',
                },
                payload: TEST_GUILD,
            });

            expect(response.statusCode).toBe(401);
        });

        it('should reject guild creation with invalid token', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/guilds',
                headers: {
                    authorization: 'Bearer invalid-token',
                    'content-type': 'application/json',
                },
                payload: TEST_GUILD,
            });

            expect(response.statusCode).toBe(401);
        });

        it('should reject guild creation with missing required fields', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/guilds',
                headers: {
                    authorization: `Bearer ${userAccessToken}`,
                    'content-type': 'application/json',
                },
                payload: {
                    // Missing name field
                    isPublic: true,
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it('should allow creating a private guild', async () => {
            const privateGuild = {
                name: 'Private Test Guild',
                isPublic: false,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/guilds',
                headers: {
                    authorization: `Bearer ${userAccessToken}`,
                    'content-type': 'application/json',
                },
                payload: privateGuild,
            });

            expect([200, 201, 204]).toContain(response.statusCode);
        });
    });

    describe('Public Guilds Endpoint', () => {
        it('should retrieve public guilds with authentication', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/guilds/public',
                headers: {
                    authorization: `Bearer ${userAccessToken}`,
                },
            });

            expect([200, 201, 204]).toContain(response.statusCode);

            if (response.statusCode === 200) {
                const guilds = JSON.parse(response.body);
                expect(Array.isArray(guilds)).toBe(true);
            }
        });

        it('should retrieve public guilds without authentication', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/guilds/public',
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('Socket Connection for Guild Events', () => {
        it('should reject socket connection without authentication', async () => {
            const socketUrl = `http://localhost:${process.env.API_PORT || 8081}`;

            const unauthSocket = io(socketUrl, {
                transports: ['websocket', 'polling'],
                reconnection: false,
                timeout: 5000,
            });

            const result = await new Promise<'connected' | 'disconnected' | 'timeout'>((resolve) => {
                // Si se conecta inicialmente pero luego se desconecta (comportamiento esperado)
                let wasConnected = false;

                unauthSocket.on('connect', () => {
                    wasConnected = true;
                });

                unauthSocket.on('disconnect', () => {
                    if (wasConnected) {
                        resolve('disconnected');
                    }
                });

                unauthSocket.on('connect_error', () => {
                    resolve('disconnected');
                });

                setTimeout(() => {
                    if (unauthSocket.connected) {
                        resolve('connected');
                    } else {
                        resolve('timeout');
                    }
                }, 3000);
            });

            // El resultado debe ser 'disconnected' (rechazado por el servidor)
            // NO debe quedarse conectado
            expect(result).toBe('disconnected');
            expect(unauthSocket.connected).toBe(false);

            unauthSocket.disconnect();
        });

        it('should establish socket connection with valid token', async () => {
            const socketUrl = `http://localhost:${process.env.API_PORT || 8081}`;

            socketClient = io(socketUrl, {
                auth: {
                    token: userAccessToken,
                },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                transports: ['websocket', 'polling'],
                timeout: 10000,
            });

            const connected = await new Promise<boolean>((resolve) => {
                socketClient.on('connect', () => resolve(true));
                socketClient.on('connect_error', () => resolve(false));

                setTimeout(() => resolve(false), 5000);
            });

            expect(connected).toBe(true);
        });
    });
});
