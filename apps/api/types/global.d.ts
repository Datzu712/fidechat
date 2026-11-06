declare interface IEnvironmentVariables {
    // Api
    NODE_ENV: 'development' | 'production' | 'test';
    API_PORT: number;
    SOCKET_NAMESPACE?: string;
    WEB_DIST_DIR?: string; // Built web SPA to serve from the API (production image only)
    CORS_ORIGIN: string;

    // fidechat config
    DEFAULT_GUILD_ID?: string;

    // Postgres
    DATABASE_URL: string;
    DATABASE_POOL_MAX?: number;

    // Keycloak
    KEYCLOAK_URL: string;
    KEYCLOAK_REALM: string;
    KEYCLOAK_CLIENT_ID: string;
    KEYCLOAK_CLIENT_SECRET: string;
    PUBLIC_KEYCLOAK_URL: string; // Public URL for Keycloak
    KEYCLOAK_ADMIN: string;
    KEYCLOAK_ADMIN_PASSWORD: string;

    // BFF login
    AUTH_CALLBACK_URL: string; // Public URL of GET /api/v1/auth/callback, registered in the Keycloak client
    PUBLIC_WEB_URL: string; // Where the browser lands after login and logout

    // chat yipiti
    OPENAI_API_KEY: string;
}

declare interface IReqUser {
    exp: number;
    iat: number;
    auth_time: number;
    jti: string;
    iss: string;
    aud: string;
    sub: string;
    typ: string;
    azp: string;
    sid: string;
    acr: string;
    'allowed-origins': string[];
    realm_access: {
        roles: string[];
    };
    resource_access: Record<string, { roles: string[] }>;
    scope: string;
    email_verified: boolean;
    name: string;
    preferred_username: string;
    given_name: string;
    family_name: string;
    email: string;
    [key: string]: any;
}

// just an alias for IReqUser
declare type KeycloakJwtPayload = IReqUser;

declare namespace NodeJS {
    export interface ProcessEnv extends IEnvironmentVariables {
        TZ?: string;
    }
}
