import type React from 'react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className="u-flex u-flex-column u-vertically-center u-horizontally-center"
            style={{
                minHeight: '100vh',
                background: 'var(--color-light)',
                padding: '1rem',
            }}
        >
            {children}
        </div>
    );
}
