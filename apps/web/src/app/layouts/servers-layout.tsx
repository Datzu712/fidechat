import { Navigate, Outlet } from 'react-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ServerSidebar } from '@/features/guilds/components/server-sidebar';
import { useSyncStatus } from '@/features/sync/hooks/sync-query';
import { BackendExtras } from '@/shared/backend/implementation';
import { FullScreenSpinner } from '@/shared/components/full-screen-spinner';
import { useSocket } from '@/shared/socket/use-socket';
import { Button } from '@/shared/ui/button';

/** The one auth and loading gate: every page below it has the synced state. */
export function ServersLayout() {
    const { status } = useAuth();
    const { connected } = useSocket();
    const { isLoaded, isError, retry } = useSyncStatus();

    if (status === 'unauthenticated') return <Navigate to="/login" replace />;
    if (!isLoaded && isError) return <SyncError onRetry={retry} />;
    if (!isLoaded) return <FullScreenSpinner />;

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <BackendExtras />
            {!connected && (
                <div
                    role="status"
                    className="bg-amber-600 text-white text-sm text-center py-1"
                >
                    Connection lost. Reconnecting...
                </div>
            )}
            <div className="flex flex-1 min-h-0">
                <ServerSidebar />
                <Outlet />
            </div>
        </div>
    );
}

function SyncError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 min-h-screen w-full bg-discord-chat text-center">
            <p className="text-zinc-300">Could not load your servers.</p>
            <Button onClick={onRetry}>Try again</Button>
        </div>
    );
}
