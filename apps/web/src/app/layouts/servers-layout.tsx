import { Navigate, Outlet } from 'react-router';

import { useAuth } from '@/features/auth/use-auth';
import { ServerSidebar } from '@/features/guilds/server-sidebar';
import { useSyncStatus } from '@/features/sync/sync-query';
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
