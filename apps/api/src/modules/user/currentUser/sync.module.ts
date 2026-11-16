import { Module } from '@nestjs/common';

import { GatewayModule } from '@/modules/gateway/gateway.module.js';

import { SyncController } from './sync.controller.js';
import { SyncRepository } from './sync.repository.js';
import { SyncService } from './sync.service.js';

@Module({
    controllers: [SyncController],
    providers: [SyncService, SyncRepository],
    imports: [GatewayModule],
})
export class SyncModule {}
