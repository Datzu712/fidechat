'use client';

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function LoginPage() {
    const { status } = useSession();

    useEffect(() => {
        if (status === 'unauthenticated') {
            signIn('keycloak');
        }

        if (status === 'authenticated') {
            redirect('/servers');
        }
    }, [status]);

    return <div>Redirigiendo...</div>;
}
