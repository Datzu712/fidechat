import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { HandshakeAuthenticator } from './handshake-authenticator.js';
import { PresenceService } from './presence.service.js';
import { SocketEmitter } from './socket-emitter.js';
import { SocketGateway } from './socket.gateway.js';

@Module({
    imports: [AuthModule],
    providers: [SocketGateway, HandshakeAuthenticator, PresenceService, SocketEmitter],
    exports: [SocketEmitter, PresenceService],
})
export class GatewayModule {}
