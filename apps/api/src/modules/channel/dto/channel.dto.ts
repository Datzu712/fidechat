import { IsNumber, IsOptional, IsString } from 'class-validator';

/** Contrato HTTP para crear un canal. `guildId` viaja en la URL. */
export class ChannelDto {
    @IsString()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    position?: number;
}
