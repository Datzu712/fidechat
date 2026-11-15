/** `GET /auth/me`: the caller's identity. */
export interface AuthMe {
    sub: string;
    name: string;
    username: string;
    email: string;
}
