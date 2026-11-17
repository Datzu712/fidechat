import { Navigate, Outlet } from 'react-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ServerSidebar } from '@/features/guilds/components/server-sidebar';
import { useSyncStatus } from '@/features/sync/hooks/sync-query';
import { FullScreenSpinner } from '@/shared/components/full-screen-spinner';

/** The one auth and loading gate: every page below it has the synced state. */
export function ServersLayout() {
    const { status } = useAuth();
    const { isLoaded } = useSyncStatus();

    if (status === 'unauthenticated') return <Navigate to="/login" replace />;
    if (!isLoaded) return <FullScreenSpinner />;

    return (
        <div className="flex h-screen overflow-hidden">
            <ServerSidebar />
            <Outlet />
        </div>
    );
}
