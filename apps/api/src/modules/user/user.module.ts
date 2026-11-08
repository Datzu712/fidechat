import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.js';
import { SyncModule } from './currentUser/sync.module.js';
import { GatewayModule } from '../gateway/gateway.module.js';

@Module({
    imports: [SyncModule, GatewayModule],
    providers: [UserService, UserRepository],
    exports: [UserService, UserRepository],
})
export class UserModule {}
