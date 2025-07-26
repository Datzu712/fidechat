'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMockData } from '@/components/mock-data-provider';
import { ServerSidebar } from '@/components/server-sidebar';

export default function ChannelsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { currentUser } = useMockData();
    const router = useRouter();

    // useEffect(() => {
    //     if (!currentUser) {
    //         router.push('/login');
    //     }
    // }, [currentUser, router]);

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <ServerSidebar />
            {children}
        </div>
    );
}
