import { Outlet } from 'react-router';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { MockDataProvider } from '@/components/mock-data-provider';
import { Providers } from './providers';

/** Root route: the providers live inside the router so they can use its hooks. */
export default function RootLayout() {
    return (
        <Providers>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
            >
                <MockDataProvider>
                    <Outlet />
                    <Toaster />
                </MockDataProvider>
            </ThemeProvider>
        </Providers>
    );
}
