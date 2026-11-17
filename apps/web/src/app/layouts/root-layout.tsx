import { Outlet } from 'react-router';

import { Providers } from '@/app/providers';
import { ThemeProvider } from '@/app/theme-provider';
import { Toaster } from '@/shared/ui/toaster';

/** Root route: the providers live inside the router so they can use its hooks. */
export function RootLayout() {
    return (
        <Providers>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
            >
                <Outlet />
                <Toaster />
            </ThemeProvider>
        </Providers>
    );
}
