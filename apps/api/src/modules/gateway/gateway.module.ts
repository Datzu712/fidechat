import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    providers: [GatewayService],
    exports: [GatewayService],
})
export class GatewayModule {}
