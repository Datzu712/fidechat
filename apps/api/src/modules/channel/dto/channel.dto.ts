import type { ChannelPayload } from '@fidechat/shared';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

/** HTTP body to create a channel; `guildId` comes from the URL. */
export class ChannelDto implements ChannelPayload {
    @IsString({ groups: ['create'] })
    @IsNotEmpty({ groups: ['create'] })
    name!: string;

    @IsString({ groups: ['create'] })
    @IsOptional({ groups: ['create'] })
    description?: string;

    @IsNumber({}, { groups: ['create'] })
    @IsOptional({ groups: ['create'] })
    position?: number;
}
