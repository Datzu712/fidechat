import 'dotenv/config';
import { VersioningType } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { DRIZZLE, type DrizzleDB } from '@/infrastructure/database/drizzle.provider.js';
import { guildUsers } from '@/infrastructure/database/schema/index.js';
import { KeycloakClient } from '@/infrastructure/keycloak/index.js';

import { AppModule } from '../src/modules/app.module.js';

/** Guild-scoped writes: only members post, only authors edit or delete, only owners create channels. */
describe('Guild-scoped write authorization E2E', () => {
    let app: NestFastifyApplication;

    const keycloakClient = new KeycloakClient({
        url: process.env.PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
        realm: process.env.KEYCLOAK_REALM || 'fidechat',
        clientId: process.env.KEYCLOAK_CLIENT_ID || 'fidechat',
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'my_crazy_secret',
        adminUsername: process.env.KEYCLOAK_ADMIN || 'admin',
        adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    });

    const users = {
        owner: { username: 'authz-owner-e2e', email: 'authz-owner-e2e@fidechat.com' },
        member: { username: 'authz-member-e2e', email: 'authz-member-e2e@fidechat.com' },
        outsider: { username: 'authz-outsider-e2e', email: 'authz-outsider-e2e@fidechat.com' },
    };
    const PASSWORD = 'TestPassword123!';

    const ids: Record<keyof typeof users, string> = { owner: '', member: '', outsider: '' };
    const tokens: Record<keyof typeof users, string> = { owner: '', member: '', outsider: '' };

    let guildId: string;
    let otherGuildId: string;
    let channelId: string;

    const request = async ({
        as,
        method,
        url,
        payload,
    }: {
        as: keyof typeof users;
        method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
        url: string;
        payload?: object;
    }) =>
        app.inject({
            method,
            url: `/api/v1${url}`,
            // Fastify refuses an empty body sent as JSON, so only bodies get the header.
            headers: {
                authorization: `Bearer ${tokens[as]}`,
                ...(payload ? { 'content-type': 'application/json' } : {}),
            },
            ...(payload ? { payload } : {}),
        });

    const postMessage = async ({
        as,
        content,
        guild = guildId,
    }: {
        as: keyof typeof users;
        content: string;
        guild?: string;
    }) => request({ as, method: 'POST', url: `/guilds/${guild}/channels/${channelId}/messages`, payload: { content } });

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        app.enableVersioning({ type: VersioningType.URI, prefix: 'v' });
        app.setGlobalPrefix('api');
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        await keycloakClient.connect();
        for (const key of Object.keys(users) as Array<keyof typeof users>) {
            ids[key] = await keycloakClient.createUser({
                ...users[key],
                password: PASSWORD,
                firstName: 'Authz',
                lastName: key,
            });
            tokens[key] = (await keycloakClient.getUserToken(users[key].username, PASSWORD)).access_token;
            // Any authenticated request upserts the user into app_user.
            await request({ as: key, method: 'GET', url: '/users/@me/sync' });
        }

        const guild = await request({
            as: 'owner',
            method: 'POST',
            url: '/guilds',
            payload: { name: 'Authz guild', isPublic: false },
        });
        guildId = guild.json<{ id: string }>().id;
        const other = await request({
            as: 'owner',
            method: 'POST',
            url: '/guilds',
            payload: { name: 'Authz other guild', isPublic: false },
        });
        otherGuildId = other.json<{ id: string }>().id;

        const channel = await request({
            as: 'owner',
            method: 'POST',
            url: `/guilds/${guildId}/channels`,
            payload: {
                name: 'authz',
                position: 0,
            },
        });
        channelId = channel.json<{ id: string }>().id;

        // There is no join endpoint yet: add the member directly.
        await app.get<DrizzleDB>(DRIZZLE).insert(guildUsers).values({ guildId, userId: ids.member });
    });

    afterAll(async () => {
        for (const id of Object.values(ids)) {
            if (id) await keycloakClient.deleteUser(id);
        }
        await app.close();
    });

    describe('channels', () => {
        it('lets the owner create a channel', async () => {
            const res = await request({
                as: 'owner',
                method: 'POST',
                url: `/guilds/${guildId}/channels`,
                payload: {
                    name: 'owner-ok',
                    position: 1,
                },
            });
            expect(res.statusCode).toBe(201);
        });

        it('refuses a channel from a member who is not the owner', async () => {
            const res = await request({
                as: 'member',
                method: 'POST',
                url: `/guilds/${guildId}/channels`,
                payload: { name: 'nope', position: 1 },
            });
            expect(res.statusCode).toBe(403);
        });

        it('refuses a channel from a non-member', async () => {
            const res = await request({
                as: 'outsider',
                method: 'POST',
                url: `/guilds/${guildId}/channels`,
                payload: { name: 'nope', position: 1 },
            });
            expect(res.statusCode).toBe(403);
        });
    });

    describe('creating messages', () => {
        it('lets a member post', async () => {
            const res = await postMessage({ as: 'member', content: 'hello from a member' });
            expect(res.statusCode).toBe(201);
        });

        it('refuses a non-member', async () => {
            const res = await postMessage({ as: 'outsider', content: 'let me in' });
            expect(res.statusCode).toBe(403);
        });

        it('refuses a channel addressed through another guild', async () => {
            const res = await postMessage({ as: 'owner', content: 'wrong guild', guild: otherGuildId });
            expect(res.statusCode).toBe(404);
        });
    });

    describe('editing and deleting messages', () => {
        let messageId: string;
        const messageUrl = (guild = guildId) => `/guilds/${guild}/channels/${channelId}/messages/${messageId}`;

        beforeEach(async () => {
            messageId = (await postMessage({ as: 'owner', content: 'owner message' })).json<{ id: string }>().id;
        });

        it('refuses an edit from a member who is not the author', async () => {
            const res = await request({
                as: 'member',
                method: 'PATCH',
                url: messageUrl(),
                payload: { content: 'hijacked' },
            });
            expect(res.statusCode).toBe(403);
        });

        it('refuses a delete from a member who is not the author', async () => {
            const res = await request({ as: 'member', method: 'DELETE', url: messageUrl() });
            expect(res.statusCode).toBe(403);
        });

        it('refuses an edit from a non-member', async () => {
            const res = await request({
                as: 'outsider',
                method: 'PATCH',
                url: messageUrl(),
                payload: { content: 'hijacked' },
            });
            expect(res.statusCode).toBe(403);
        });

        it('refuses a message addressed through another guild', async () => {
            const res = await request({
                as: 'owner',
                method: 'PATCH',
                url: messageUrl(otherGuildId),
                payload: { content: 'moved' },
            });
            expect(res.statusCode).toBe(404);
        });

        it('lets the author edit and delete their message', async () => {
            const edit = await request({
                as: 'owner',
                method: 'PATCH',
                url: messageUrl(),
                payload: { content: 'edited' },
            });
            expect(edit.statusCode).toBe(200);

            const del = await request({ as: 'owner', method: 'DELETE', url: messageUrl() });
            expect(del.statusCode).toBe(200);
        });
    });
});
