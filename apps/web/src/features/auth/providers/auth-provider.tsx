import type { AuthMe } from '@fidechat/shared';
import { type ReactNode, useEffect, useState } from 'react';

import {
    AuthContext,
    type AuthStatus,
} from '@/features/auth/providers/auth-context';
import { backend } from '@/shared/backend/implementation';

/**
 * The API runs the login and keeps the tokens (BFF); the browser only has an HttpOnly session
 * cookie. This asks the API once whether that cookie is a valid session.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [user, setUser] = useState<AuthMe | null>(null);

    useEffect(() => {
        let unmounted = false;
        void backend.getSession().then((session) => {
            if (unmounted) return;
            setUser(session);
            setStatus(session ? 'authenticated' : 'unauthenticated');
        });
        return () => {
            unmounted = true;
        };
    }, []);

    return (
        <AuthContext.Provider value={{ status, user }}>
            {children}
        </AuthContext.Provider>
    );
};
