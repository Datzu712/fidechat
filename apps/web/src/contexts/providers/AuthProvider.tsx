import { type ReactNode, useEffect, useState } from 'react';
import type { AuthMe } from '@fidechat/shared';
import { AuthContext, type AuthStatus } from '../authContext';

/**
 * The API runs the login and keeps the tokens (BFF); the browser only has an HttpOnly session
 * cookie. This asks the API once whether that cookie is a valid session.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [user, setUser] = useState<AuthMe | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch('/api/v1/auth/me', { signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                setUser((await response.json()) as AuthMe);
                setStatus('authenticated');
            })
            .catch(() => {
                if (!controller.signal.aborted) setStatus('unauthenticated');
            });
        return () => controller.abort();
    }, []);

    return (
        <AuthContext.Provider value={{ status, user }}>
            {children}
        </AuthContext.Provider>
    );
};
