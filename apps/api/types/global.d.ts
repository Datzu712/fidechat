declare interface IEnvironmentVariables {
    // Api
    NODE_ENV: 'development' | 'production' | 'test';
    API_PORT: number;
    SOCKET_NAMESPACE?: string;
    WEB_DIST_DIR?: string; // Built web SPA to serve from the API (production image only)
    TRUST_PROXY?: string; // Comma-separated proxy IPs/CIDRs trusted for X-Forwarded-For

    // fidechat config
    DEFAULT_GUILD_ID: string; // Guild every user is added to on first login

    // Postgres
    DATABASE_URL: string;
    DATABASE_POOL_MAX?: number;

    // Keycloak
    KEYCLOAK_URL: string;
    KEYCLOAK_REALM: string;
    KEYCLOAK_CLIENT_ID: string;
    KEYCLOAK_CLIENT_SECRET: string;
    PUBLIC_KEYCLOAK_URL: string; // Public URL for Keycloak
    KEYCLOAK_ADMIN: string; // e2e tests only (they create test users)
    KEYCLOAK_ADMIN_PASSWORD: string; // e2e tests only

    // BFF login
    AUTH_CALLBACK_URL: string; // Public URL of GET /api/v1/auth/callback, registered in the Keycloak client
    PUBLIC_WEB_URL: string; // Where the browser lands after login and logout

    // AI bots
    AI_MODEL?: string; // provider:model, defaults to anthropic:claude-haiku-5-5
    AI_ROUTER?: 'on' | 'off'; // defaults to on
    ANTHROPIC_API_KEY?: string;
    OPENAI_API_KEY?: string;
    OLLAMA_BASE_URL?: string; // defaults to http://localhost:11434/v1
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

declare namespace NodeJS {
    export interface ProcessEnv extends IEnvironmentVariables {
        TZ?: string;
    }
}
