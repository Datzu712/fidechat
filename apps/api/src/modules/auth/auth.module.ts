import { Module } from '@nestjs/common';
import { TokenVerifier } from './token-verifier.service';
import { SessionController } from './session/session.controller';
import { SessionService } from './session/session.service';

@Module({
    controllers: [SessionController],
    providers: [TokenVerifier, SessionService],
    exports: [TokenVerifier, SessionService],
})
export class AuthModule {}
