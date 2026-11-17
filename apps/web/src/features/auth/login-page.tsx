import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router';

import { useAuth } from '@/features/auth/use-auth';

/** The API runs the Keycloak login (BFF) and comes back to the web app with a session cookie. */
const LOGIN_URL = '/api/v1/auth/login';

export function LoginPage() {
    const { status } = useAuth();
    const [searchParams] = useSearchParams();
    const loginError = searchParams.get('login_error');

    useEffect(() => {
        if (status === 'unauthenticated' && !loginError) {
            window.location.href = LOGIN_URL;
        }
    }, [status, loginError]);

    if (status === 'authenticated') return <Navigate to="/servers" replace />;

    if (loginError) {
        return (
            <div className="flex flex-col items-center gap-4">
                <p>Could not log in ({loginError}).</p>
                <a
                    href={LOGIN_URL}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
                >
                    Try again
                </a>
            </div>
        );
    }

    return <div>Redirecting...</div>;
}
