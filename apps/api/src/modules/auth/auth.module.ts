import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TokenVerifier } from './token-verifier.service.js';
import { SessionController } from './session/session.controller.js';
import { SessionService } from './session/session.service.js';

@Module({
    imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }])],
    controllers: [SessionController],
    providers: [TokenVerifier, SessionService],
    exports: [TokenVerifier, SessionService],
})
export class AuthModule {}
