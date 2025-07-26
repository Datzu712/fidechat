'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMockData } from '@/components/mock-data-provider';
import { ChannelSidebar } from '@/components/channel-sidebar';
// Import the MembersSidebar component
import { MembersSidebar } from '@/components/members-sidebar';

export default function ServerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { serverId: string };
}) {
    const { currentUser, isUserServerMember } = useMockData();
    const router = useRouter();

    useEffect(() => {
        // if (!currentUser) {
        //   router.push("/login")
        //   return
        // }

        // Check if user is a member of this server
        if (!isUserServerMember(currentUser.id, params.serverId)) {
            router.push('/channels');
        }
    }, [currentUser, isUserServerMember, params.serverId, router]);

    if (!currentUser || !isUserServerMember(currentUser.id, params.serverId)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Update the return statement to include the MembersSidebar
    return (
        <>
            <ChannelSidebar serverId={params.serverId} />
            <div className="flex-1 flex min-w-0">{children}</div>
            <MembersSidebar
                serverId={params.serverId}
                className="hidden lg:flex flex-shrink-0"
            />
        </>
    );
}
