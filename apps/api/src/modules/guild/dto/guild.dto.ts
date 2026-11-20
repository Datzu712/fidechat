import type { GuildPayload } from '@fidechat/shared';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * HTTP body to create a guild. Not derived from the database row on purpose:
 * the Drizzle schema uses `null` for optional columns, the payload absent fields.
 */
export class GuildDto implements GuildPayload {
    @IsString({ groups: ['create'] })
    @IsNotEmpty({ groups: ['create'] })
    name!: string;

    @IsOptional({ groups: ['create'] })
    @IsString({ groups: ['create'] })
    @IsUrl({}, { groups: ['create'] })
    iconUrl?: string;

    @IsBoolean({ groups: ['create'] })
    @IsOptional({ groups: ['create'] })
    isPublic?: boolean;

    // ownerId se toma del usuario autenticado, no del body.
}
