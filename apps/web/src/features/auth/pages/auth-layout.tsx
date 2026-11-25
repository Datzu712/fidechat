import { Outlet } from 'react-router';

export function AuthLayout() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-discord-rail p-4 text-foreground">
            <Outlet />
        </div>
    );
}
