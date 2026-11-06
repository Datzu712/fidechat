import 'dotenv/config';

import type { AddressInfo } from 'node:net';
import { Test, type TestingModule } from '@nestjs/testing';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { io, type Socket } from 'socket.io-client';

import { AppModule } from '../src/modules/app.module';

async function handshakeOutcome(socket: Socket): Promise<'connected' | 'refused'> {
    // oxlint-disable-next-line promise/avoid-new -- socket.io-client only exposes callbacks
    return new Promise((resolve) => {
        socket.on('connect', () => resolve('connected'));
        socket.on('connect_error', () => resolve('refused'));
    });
}

describe('Gateway handshake E2E', () => {
    let app: NestFastifyApplication;

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
    });

    afterAll(async () => {
        await app.close();
    });

    // Known failure: GatewayService accepts the connection and only then calls `socket.disconnect()`
    // (see the todo on `handleConnection`). The handshake should be refused instead, so an
    // unauthenticated client never gets a `connect` event.
    it('should refuse the handshake when no token is provided', async () => {
        const { port } = app.getHttpServer().address() as AddressInfo;
        const socket = io(`http://localhost:${port}`, {
            transports: ['websocket'],
            reconnection: false,
        });

        const outcome = await handshakeOutcome(socket);
        socket.disconnect();

        expect(outcome).toBe('refused');
    });
});
