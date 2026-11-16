import { Module } from '@nestjs/common';

import { GatewayModule } from '../gateway/gateway.module.js';
import { UserRepository } from '../user/user.repository.js';
import { ChannelController } from './channel.controller.js';
import { ChannelRepository } from './channel.repository.js';
import { ChannelService } from './channel.service.js';

@Module({
    controllers: [ChannelController],
    providers: [ChannelService, ChannelRepository, UserRepository],
    imports: [GatewayModule],
    exports: [ChannelRepository],
})
export class ChannelModule {}
