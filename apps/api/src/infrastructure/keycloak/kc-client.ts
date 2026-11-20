import type { CreateUserData, KeycloakTokenResponse, KeycloakUser } from './kc-types.js';

export interface KeycloakClientOptions {
    url: string;
    realm: string;
    clientId: string;
    clientSecret: string;
    adminUsername: string;
    adminPassword: string;
}

export class KeycloakClient {
    public isAuthenticated = false;
    private accessToken: string | null = null;

    constructor(private readonly config: KeycloakClientOptions) {}

    /**
     * Authenticate with Keycloak admin API and get admin access token
     */
    public async connect(): Promise<void> {
        const params = new URLSearchParams({
            grant_type: 'password',
            client_id: 'admin-cli',
            username: this.config.adminUsername,
            password: this.config.adminPassword,
        });

        const response = await fetch(`${this.config.url}/realms/master/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get admin token: ${response.statusText}`);
        }

        const data = (await response.json()) as KeycloakTokenResponse;
        if (!data.access_token) throw new Error('No access token in response');

        this.isAuthenticated = true;
        this.accessToken = data.access_token;
    }

    /**
     * Find a user by username
     */
    public async findUserByUsername(username: string): Promise<KeycloakUser | null> {
        this.ensureAuthenticated();

        const searchResponse = await fetch(
            `${this.config.url}/admin/realms/${this.config.realm}/users?username=${username}`,
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            },
        );

        if (!searchResponse.ok) {
            throw new Error(`Failed to search user: ${searchResponse.statusText}`);
        }

        const users = (await searchResponse.json()) as KeycloakUser[];
        return users.length > 0 ? users[0] : null;
    }

    /**
     * Create a test user in Keycloak
     */
    public async createUser(user: CreateUserData): Promise<string> {
        this.ensureAuthenticated();

        const existingUser = await this.findUserByUsername(user.username);
        if (existingUser) {
            await this.deleteUser(existingUser.id);
        }

        const createResponse = await fetch(`${this.config.url}/admin/realms/${this.config.realm}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.accessToken}`,
            },
            body: JSON.stringify({
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                enabled: true,
                emailVerified: true,
            }),
        });

        if (!createResponse.ok) {
            const error = await createResponse.text();
            throw new Error(`Failed to create test user: ${createResponse.statusText} - ${error}`);
        }

        const location = createResponse.headers.get('location');
        const userId = location?.split('/').pop();

        if (!userId) {
            throw new Error('Failed to get user ID from location header');
        }

        // Set user password
        await this.setUserPassword(userId, user.password);
        return userId;
    }

    /**
     * Set password for a user
     */
    private async setUserPassword(userId: string, password: string): Promise<void> {
        this.ensureAuthenticated();

        const response = await fetch(
            `${this.config.url}/admin/realms/${this.config.realm}/users/${userId}/reset-password`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.accessToken}`,
                },
                body: JSON.stringify({
                    type: 'password',
                    value: password,
                    temporary: false,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`Failed to set user password: ${response.statusText}`);
        }
    }

    public async deleteUser(userId: string): Promise<void> {
        this.ensureAuthenticated();

        const response = await fetch(`${this.config.url}/admin/realms/${this.config.realm}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });

        if (!response.ok && response.status !== 404) {
            throw new Error(`Failed to delete user: ${response.statusText}`);
        }
    }

    public async getUserToken(username: string, password: string): Promise<KeycloakTokenResponse> {
        // This simulates what would happen in a federated login flow
        // In production, this would be handled by NextAuth/Keycloak directly
        const params = new URLSearchParams({
            grant_type: 'password',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            scope: 'openid',
            username,
            password,
        });

        const response = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get user token: ${response.statusText} - ${error}`);
        }

        return (await response.json()) as KeycloakTokenResponse;
    }

    /**
     * Ensure the client is authenticated before making admin API calls
     */
    private ensureAuthenticated(): void {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Client is not authenticated. Call connect() first.');
        }
    }
}
