import { Outlet } from 'react-router';

import { Providers } from '@/app/providers';
import { Toaster } from '@/shared/ui/toaster';

/** Root route: the providers live inside the router so they can use its hooks. */
export function RootLayout() {
    return (
        <Providers>
            <Outlet />
            <Toaster />
        </Providers>
    );
}
