import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * Contrato HTTP para crear/actualizar un guild.
 *
 * No se deriva de la fila de la base de datos a proposito: el schema de Drizzle
 * usa `null` para las columnas opcionales, mientras que el payload usa campos
 * ausentes.
 */
export class GuildDto {
    @IsString({ groups: ['create', 'update'] })
    @IsNotEmpty({ groups: ['create'] })
    name!: string;

    @IsOptional({ groups: ['create', 'update'] })
    @IsString({ groups: ['create', 'update'] })
    @IsUrl({}, { groups: ['create', 'update'] })
    iconUrl?: string;

    @IsBoolean({ groups: ['create', 'update'] })
    @IsOptional({ groups: ['create', 'update'] })
    isPublic?: boolean;

    // ownerId se toma del usuario autenticado, no del body.
}
