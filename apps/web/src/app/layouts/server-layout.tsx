import { Outlet, useParams } from 'react-router';

import { useAuth } from '@/features/auth/use-auth';
import { ChannelSidebar } from '@/features/channels/channel-sidebar';
import { MembersSidebar } from '@/features/members/members-sidebar';

export function ServerLayout() {
    const { status } = useAuth();
    const params = useParams<{ id: string }>() as { id: string };

    if (status !== 'authenticated') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <>
            <ChannelSidebar serverId={params.id} />
            <div className="flex-1 flex min-w-0">
                <Outlet />
            </div>
            <MembersSidebar
                serverId={params.id}
                className="hidden lg:flex shrink-0"
            />
        </>
    );
}
