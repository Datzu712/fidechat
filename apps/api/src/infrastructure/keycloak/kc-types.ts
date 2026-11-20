export interface KeycloakTokenResponse {
    access_token: string;
    id_token?: string;
    expires_in: number;
    refresh_expires_in: number;
    refresh_token: string;
    token_type: string;
    not_before_policy: number;
    session_state: string;
    scope: string;
}

export interface KeycloakUser {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    enabled: boolean;
    emailVerified: boolean;
    createdTimestamp?: number;
}

export interface CreateUserData {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
