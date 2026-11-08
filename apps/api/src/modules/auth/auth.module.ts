import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TokenVerifier } from './token-verifier.service';
import { SessionController } from './session/session.controller';
import { SessionService } from './session/session.service';

@Module({
    imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }])],
    controllers: [SessionController],
    providers: [TokenVerifier, SessionService],
    exports: [TokenVerifier, SessionService],
})
export class AuthModule {}
