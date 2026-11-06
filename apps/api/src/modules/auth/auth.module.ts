import { Module } from '@nestjs/common';
import { TokenVerifier } from './token-verifier.service';

@Module({
    providers: [TokenVerifier],
    exports: [TokenVerifier],
})
export class AuthModule {}
