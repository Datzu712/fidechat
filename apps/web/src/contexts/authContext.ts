import type { AuthMe } from '@fidechat/shared';
import { createContext } from 'react';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
    status: AuthStatus;
    user: AuthMe | null;
}

export const AuthContext = createContext<AuthContextType>({
    status: 'loading',
    user: null,
});
