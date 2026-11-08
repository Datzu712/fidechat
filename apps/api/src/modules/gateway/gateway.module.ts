import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [AuthModule],
    providers: [GatewayService],
    exports: [GatewayService],
})
export class GatewayModule {}
