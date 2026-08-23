'use client';

import type React from 'react';
import { ChannelSidebar } from '@/components/channel-sidebar';
// Import the MembersSidebar component
import { MembersSidebar } from '@/components/members-sidebar';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';

export default function ServerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { status } = useSession();
    const params = useParams<{ id: string }>();

    //useEffect(() => {
    // // Check if user is a member of this server
    // if (!isUserServerMember(data?.user?.image, params.serverId)) {
    //     router.push('/servers');
    // }
    //}, [router, params.serverId]);

    if (status !== 'authenticated') {
        // || !isUserServerMember(currentUser.id, params.serverId)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Update the return statement to include the MembersSidebar
    return (
        <>
            <ChannelSidebar serverId={params.id} />
            <div className="flex-1 flex min-w-0">{children}</div>
            <MembersSidebar
                serverId={params.id}
                className="hidden lg:flex flex-shrink-0"
            />
        </>
    );
}
