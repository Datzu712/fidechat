import { Outlet } from 'react-router';

export default function AuthLayout() {
    return (
        <div
            className="u-flex u-flex-column u-vertically-center u-horizontally-center"
            style={{
                minHeight: '100vh',
                background: 'var(--color-light)',
                padding: '1rem',
            }}
        >
            <Outlet />
        </div>
    );
}
