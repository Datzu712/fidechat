import { Module } from '@nestjs/common';
import { GuildController } from './guild.controller.js';
import { GuildService } from './guild.service.js';
import { GuildRepository } from './guild.repository.js';
import { GatewayModule } from '../gateway/gateway.module.js';

@Module({
    controllers: [GuildController],
    providers: [GuildService, GuildRepository],
    imports: [GatewayModule],
})
export class GuildModule {}
