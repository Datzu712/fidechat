import { Module } from '@nestjs/common';

import { GatewayModule } from '../gateway/gateway.module.js';
import { GuildModule } from '../guild/guild.module.js';
import { UserModule } from '../user/user.module.js';
import { ChannelController } from './channel.controller.js';
import { ChannelRepository } from './channel.repository.js';
import { ChannelService } from './channel.service.js';

@Module({
    controllers: [ChannelController],
    providers: [ChannelService, ChannelRepository],
    imports: [GuildModule, UserModule],
    exports: [ChannelRepository],
})
export class ChannelModule {}
