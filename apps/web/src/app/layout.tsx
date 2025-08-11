import './globals.css';

import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { ThemeProvider } from '@/src/components/theme-provider';
import { Toaster } from '@/src/components/ui/toaster';
import { MockDataProvider } from '@/src/components/mock-data-provider';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
    title: 'Fidechat v2',
    description: 'A messaging app.',
};

// todo: move providers to a separate file
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <MockDataProvider>
                            {children}
                            <Toaster />
                        </MockDataProvider>
                    </ThemeProvider>
                </Providers>
            </body>
        </html>
    );
}
