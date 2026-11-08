import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}
export class EnvironmentVariables implements IEnvironmentVariables {
    DEFAULT_GUILD_ID?: string | undefined;
    KEYCLOAK_ADMIN!: string;
    KEYCLOAK_ADMIN_PASSWORD!: string;

    // Keycloak
    @IsString()
    KEYCLOAK_URL!: string;

    @IsString()
    KEYCLOAK_REALM!: string;

    @IsString()
    KEYCLOAK_CLIENT_ID!: string;

    @IsString()
    KEYCLOAK_CLIENT_SECRET!: string;

    // Postgres
    @IsString()
    DATABASE_URL!: string;

    @IsNumber()
    @Min(1)
    @IsOptional()
    DATABASE_POOL_MAX?: number;

    // Api
    @IsNumber()
    @Min(1)
    API_PORT!: number;

    @IsEnum(Environment)
    NODE_ENV!: Environment;

    @IsString()
    @IsOptional()
    SOCKET_NAMESPACE?: string | undefined;

    @IsString()
    @IsOptional()
    WEB_DIST_DIR?: string | undefined;

    @IsString()
    @IsOptional()
    TRUST_PROXY?: string | undefined;

    @IsString()
    PUBLIC_KEYCLOAK_URL!: string;

    // BFF login
    @IsString()
    AUTH_CALLBACK_URL!: string;

    @IsString()
    PUBLIC_WEB_URL!: string;

    @IsString()
    OPENAI_API_KEY!: string;
}
