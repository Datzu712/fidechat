import 'dotenv/config';
import type { AddressInfo } from 'node:net';

import { type AppUser, type ConnectedUser, type GuildMember, SocketEvents, type SyncPayload } from '@fidechat/shared';
import { VersioningType } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Test, type TestingModule } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';

import { KeycloakClient } from '@/infrastructure/keycloak/index.js';

import { BOTS } from '../src/modules/ai/bots.js';
import { AppModule } from '../src/modules/app.module.js';

/** Resolves with the next `event` payload that matches, or rejects after 3s. */
async function nextEvent<T>(socket: Socket, event: string, matches: (data: T) => boolean = () => true): Promise<T> {
    // oxlint-disable-next-line promise/avoid-new -- socket.io-client only exposes callbacks
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${event} timeout`)), 3000);
        const handler = (data: T) => {
            if (!matches(data)) return;
            clearTimeout(timer);
            socket.off(event, handler);
            resolve(data);
        };
        socket.on(event, handler);
    });
}

const entryOf = (users: ConnectedUser[], userId: string) => users.find((u) => u.userId === userId);

describe('Presence and membership E2E', () => {
    let app: NestFastifyApplication;
    const keycloak = new KeycloakClient({
        url: process.env.PUBLIC_KEYCLOAK_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
        adminUsername: process.env.KEYCLOAK_ADMIN,
        adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD,
    });
    const password = 'TestPassword123!';
    const createdIds: string[] = [];
    const sockets: Socket[] = [];

    async function createUser(name: string) {
        const username = `presence-${name}-e2e`;
        const id = await keycloak.createUser({
            username,
            email: `${username}@fidechat.com`,
            password,
            firstName: name,
            lastName: 'Presence',
        });
        createdIds.push(id);
        const { access_token: token } = await keycloak.getUserToken(username, password);
        return { id, token };
    }

    /** Any authenticated request runs the Keycloak sync, which adds the user to the default guild. */
    async function touch(token: string) {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/auth/me',
            headers: { authorization: `Bearer ${token}` },
        });
        expect(res.statusCode).toBe(200);
    }

    async function connect(token: string) {
        const { port } = app.getHttpServer().address() as AddressInfo;
        const socket = io(`http://localhost:${port}`, {
            auth: { token },
            transports: ['websocket'],
            reconnection: false,
        });
        sockets.push(socket);
        await nextEvent(socket, 'connect');
        return socket;
    }

    let alice: { id: string; token: string };
    let bob: { id: string; token: string };
    let aliceSocket: Socket;

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

        await keycloak.connect();
        alice = await createUser('alice');
        bob = await createUser('bob');
        await touch(alice.token);
        await touch(bob.token);
        aliceSocket = await connect(alice.token);
        await connect(bob.token);
    });

    afterAll(async () => {
        sockets.forEach((socket) => socket.disconnect());
        await Promise.all(createdIds.map(async (id) => keycloak.deleteUser(id)));
        await app.close();
    });

    it('should report connected users and the always-online bots in the sync payload', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/users/@me/sync',
            headers: { authorization: `Bearer ${alice.token}` },
        });
        expect(res.statusCode).toBe(200);
        const { connectedUsers } = res.json<SyncPayload>();
        const botId = BOTS[0].user.id;
        expect(entryOf(connectedUsers, bob.id)).toEqual({ userId: bob.id, status: 'online', isTyping: false });
        expect(entryOf(connectedUsers, botId)).toEqual({ userId: botId, status: 'online', isTyping: false });
    });

    it('should take the status owner from the token, not from the payload', async () => {
        const update = nextEvent<ConnectedUser[]>(
            aliceSocket,
            SocketEvents.USER_STATUS_UPDATE,
            (users) => entryOf(users, alice.id)?.status === 'dnd',
        );

        aliceSocket.emit(SocketEvents.UPDATE_CURRENT_STATUS, { userId: bob.id, status: 'dnd' });

        const users = await update;
        expect(users.filter((u) => u.userId === bob.id)).toEqual([
            { userId: bob.id, status: 'online', isTyping: false },
        ]);
    });

    it('should drop status updates with unknown fields or invalid values', async () => {
        const seen: ConnectedUser[] = [];
        const aliceIdle = nextEvent<ConnectedUser[]>(aliceSocket, SocketEvents.USER_STATUS_UPDATE, (users) => {
            const entry = entryOf(users, alice.id);
            if (entry) seen.push(entry);
            return entry?.status === 'idle';
        });

        aliceSocket.emit(SocketEvents.UPDATE_CURRENT_STATUS, { status: 'superadmin' });
        aliceSocket.emit(SocketEvents.UPDATE_CURRENT_STATUS, { isTyping: 'yes', typingInChannel: 42 });
        aliceSocket.emit(SocketEvents.UPDATE_CURRENT_STATUS, { isAdmin: true });
        aliceSocket.emit(SocketEvents.UPDATE_CURRENT_STATUS, { status: 'idle' });

        await aliceIdle;
        // Socket.IO keeps per-socket order, so the invalid updates were handled before the valid one.
        expect(seen).toEqual([{ userId: alice.id, status: 'idle', isTyping: false }]);
    });

    it('should not send the new member email to the guild', async () => {
        const memberAdd = nextEvent<{ user: AppUser; memberMetadata: GuildMember }>(
            aliceSocket,
            SocketEvents.MEMBER_ADD,
        );

        const carol = await createUser('carol');
        await touch(carol.token);

        const { user } = await memberAdd;
        expect(user).toEqual({ id: carol.id, username: expect.any(String), avatarUrl: null, isBot: false });
    });

    it('should broadcast that a user went offline when their socket disconnects', async () => {
        const dave = await createUser('dave');
        await touch(dave.token);
        const online = nextEvent<ConnectedUser[]>(aliceSocket, SocketEvents.USER_STATUS_UPDATE, (users) =>
            Boolean(entryOf(users, dave.id)),
        );
        const daveSocket = await connect(dave.token);
        await online;

        const offline = nextEvent<ConnectedUser[]>(
            aliceSocket,
            SocketEvents.USER_STATUS_UPDATE,
            (users) => !entryOf(users, dave.id),
        );
        daveSocket.disconnect();
        expect(entryOf(await offline, dave.id)).toBeUndefined();
    });
});
