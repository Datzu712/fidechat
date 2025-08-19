'use client';

import federatedLogout from '@/lib/federated-logout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export default function AuthGuard({ children }: React.PropsWithChildren) {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            federatedLogout();
        }
    }, [status, router]);

    if (status === 'loading') {
        return <div>Cargando...</div>;
    }

    if (status === 'unauthenticated') {
        return <div>Redirigiendo al login...</div>;
    }

    return children;
}
