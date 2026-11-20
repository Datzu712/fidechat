import { Module } from '@nestjs/common';

import { GatewayModule } from '../gateway/gateway.module.js';
import { SyncModule } from './currentUser/sync.module.js';
import { GuildEmitter } from './guild-emitter.js';
import { UserRepository } from './user.repository.js';
import { UserService } from './user.service.js';

@Module({
    imports: [SyncModule, GatewayModule],
    providers: [UserService, UserRepository, GuildEmitter],
    exports: [UserService, UserRepository, GuildEmitter],
})
export class UserModule {}
