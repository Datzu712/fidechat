import { createContext } from 'react';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/** The caller as returned by `GET /api/v1/auth/me`. */
export interface AuthUser {
    sub: string;
    name: string;
    username: string;
    email: string;
}

interface AuthContextType {
    status: AuthStatus;
    user: AuthUser | null;
}

export const AuthContext = createContext<AuthContextType>({
    status: 'loading',
    user: null,
});
