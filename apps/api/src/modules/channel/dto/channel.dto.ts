import type { ChannelPayload } from '@fidechat/shared';
import { IsNumber, IsOptional, IsString } from 'class-validator';

/** Contrato HTTP para crear un canal. `guildId` viaja en la URL. */
export class ChannelDto implements ChannelPayload {
    @IsString()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    position?: number;
}
