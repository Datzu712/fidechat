import { Navigate, Outlet, useParams } from 'react-router';

import { ChannelSidebar } from '@/features/channels/components/channel-sidebar';
import { useGuild } from '@/features/guilds/hooks/use-guilds';
import { MembersSidebar } from '@/features/members/components/members-sidebar';

export function ServerLayout() {
    const params = useParams() as { id: string };
    const guild = useGuild(params.id);

    // Unknown guild, or one the user is not a member of.
    if (!guild) return <Navigate to="/servers" replace />;

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
