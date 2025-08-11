'use client';

import { NoServerSelected } from '@/components/no-server-selected';
import { useSession } from 'next-auth/react';

export default function ChannelsPage() {
    const { status } = useSession();

    if (status !== 'authenticated') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <NoServerSelected />;
}
