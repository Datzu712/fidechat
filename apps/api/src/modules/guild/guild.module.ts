import { Module } from '@nestjs/common';

import { GatewayModule } from '../gateway/gateway.module.js';
import { GuildController } from './guild.controller.js';
import { GuildRepository } from './guild.repository.js';
import { GuildService } from './guild.service.js';

@Module({
    controllers: [GuildController],
    providers: [GuildService, GuildRepository],
    imports: [GatewayModule],
})
export class GuildModule {}
