import { Outlet } from 'react-router';

export function AuthLayout() {
    return (
        <div className="flex h-dvh flex-col items-center justify-center bg-discord-rail p-4 text-foreground">
            <Outlet />
        </div>
    );
}
