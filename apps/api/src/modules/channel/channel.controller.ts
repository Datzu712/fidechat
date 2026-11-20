import { Body, Controller, Param, Post, ValidationPipe } from '@nestjs/common';

import { AuthenticatedUser } from '@/modules/auth/auth.decorators.js';

import { ChannelService } from './channel.service.js';
import { ChannelDto } from './dto/channel.dto.js';

@Controller({
    version: '1',
    path: 'guilds/:guildId/channels',
})
export class ChannelController {
    constructor(private readonly channelService: ChannelService) {}

    @Post()
    public async createChannel(
        @Param('guildId') guildId: string,
        @AuthenticatedUser() user: IReqUser,
        @Body(
            new ValidationPipe({
                transform: true,
                transformOptions: { enableImplicitConversion: true },
                whitelist: true,
                groups: ['create'],
            }),
        )
        body: Omit<ChannelDto, 'guildId'>,
    ) {
        return this.channelService.createChannel({ guildId, userId: user.sub, channel: body });
    }
}
