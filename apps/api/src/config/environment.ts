import { IsEnum, IsIn, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}
export class EnvironmentVariables implements IEnvironmentVariables {
    // Every user is added to this guild on first login.
    // Any hex UUID shape, as Postgres accepts (the demo seed uses 4444...).
    @IsUUID('loose')
    DEFAULT_GUILD_ID!: string;

    // Only the e2e tests use the admin credentials (to create test users), so the app does not require them.
    @IsString()
    @IsOptional()
    KEYCLOAK_ADMIN!: string;

    @IsString()
    @IsOptional()
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

    // AI bots
    @IsOptional()
    @Matches(/^(anthropic|openai|ollama):.+$/, {
        message: 'AI_MODEL must look like anthropic:<model>, openai:<model> or ollama:<model>',
    })
    AI_MODEL?: string;

    @IsOptional()
    @IsIn(['on', 'off'])
    AI_ROUTER?: 'on' | 'off';

    @IsOptional()
    @IsString()
    ANTHROPIC_API_KEY?: string;

    @IsOptional()
    @IsString()
    OPENAI_API_KEY?: string;

    @IsOptional()
    @IsString()
    OLLAMA_BASE_URL?: string;
}
