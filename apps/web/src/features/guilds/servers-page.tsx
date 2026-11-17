import { useAuth } from '@/features/auth/use-auth';
import { NoServerSelected } from '@/features/guilds/no-server-selected';

export function ServersPage() {
    const { status } = useAuth();

    if (status !== 'authenticated') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <NoServerSelected />;
}
