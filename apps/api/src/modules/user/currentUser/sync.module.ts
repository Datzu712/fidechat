import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller.js';
import { SyncService } from './sync.service.js';
import { SyncRepository } from './sync.repository.js';
import { GatewayModule } from '@/modules/gateway/gateway.module.js';

@Module({
    controllers: [SyncController],
    providers: [SyncService, SyncRepository],
    imports: [GatewayModule],
})
export class SyncModule {}
