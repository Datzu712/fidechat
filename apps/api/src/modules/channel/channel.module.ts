import { Module } from '@nestjs/common';
import { ChannelController } from './channel.controller.js';
import { ChannelService } from './channel.service.js';
import { ChannelRepository } from './channel.repository.js';
import { UserRepository } from '../user/user.repository.js';
import { GatewayModule } from '../gateway/gateway.module.js';

@Module({
    controllers: [ChannelController],
    providers: [ChannelService, ChannelRepository, UserRepository],
    imports: [GatewayModule],
    exports: [ChannelRepository],
})
export class ChannelModule {}
