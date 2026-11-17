import { Navigate, Outlet } from 'react-router';

import { useAuth } from '@/features/auth/use-auth';
import { ServerSidebar } from '@/features/guilds/server-sidebar';
import { useAppContext } from '@/features/sync/use-app-context';

export function ServersLayout() {
    const { status } = useAuth();
    const { currentUser } = useAppContext();

    if (status === 'unauthenticated') return <Navigate to="/login" replace />;

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
            <Outlet />
        </div>
    );
}
