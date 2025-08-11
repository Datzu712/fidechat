'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMockData } from '@/components/mock-data-provider';
import { NoServerSelected } from '@/components/no-server-selected';

export default function ChannelsPage() {
    const { currentUser, getUserServers } = useMockData();
    const router = useRouter();

    useEffect(() => {
        // if (!currentUser) {
        //   router.push("/login")
        //   return
        // }

        // Get user's servers
        const userServers = getUserServers(currentUser.id);

        // If user has servers, redirect to the first one
        if (userServers.length > 0) {
            router.push(`/channels/${userServers[0].id}`);
        }
    }, [currentUser, getUserServers, router]);

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <NoServerSelected />;
}
