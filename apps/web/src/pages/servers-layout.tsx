import { Navigate, Outlet } from 'react-router';
import useAuth from '@/hooks/useAuth';
import { useMockData } from '@/components/mock-data-provider';
import { ServerSidebar } from '@/components/server-sidebar';

export default function ChannelsLayout() {
    const { status } = useAuth();
    const { currentUser } = useMockData();

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
