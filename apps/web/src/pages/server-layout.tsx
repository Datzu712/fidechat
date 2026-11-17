import { Outlet, useParams } from 'react-router';

import { ChannelSidebar } from '@/components/channel-sidebar';
import { MembersSidebar } from '@/components/members-sidebar';
import useAuth from '@/hooks/useAuth';

export default function ServerLayout() {
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
