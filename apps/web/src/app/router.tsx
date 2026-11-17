import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from 'react-router';

import { RootLayout } from '@/app/layouts/root-layout';
import { ServerLayout } from '@/app/layouts/server-layout';
import { ServersLayout } from '@/app/layouts/servers-layout';
import { AuthLayout } from '@/features/auth/auth-layout';
import { LoginPage } from '@/features/auth/login-page';
import { ChannelPage } from '@/features/channels/channel-page';
import { ServerPage } from '@/features/channels/server-page';
import { ServersPage } from '@/features/guilds/servers-page';

/** `/` goes through the login, keeping the query: a failed login comes back as `/?login_error=...`. */
function HomeRedirect() {
    const { search } = useLocation();
    return <Navigate to={{ pathname: '/login', search }} replace />;
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RootLayout />}>
                    <Route path="/" element={<HomeRedirect />} />
                    <Route element={<AuthLayout />}>
                        <Route path="/login" element={<LoginPage />} />
                    </Route>
                    <Route path="/servers" element={<ServersLayout />}>
                        <Route index element={<ServersPage />} />
                        <Route path=":id" element={<ServerLayout />}>
                            <Route index element={<ServerPage />} />
                            <Route
                                path="channels/:channelId"
                                element={<ChannelPage />}
                            />
                        </Route>
                    </Route>
                    <Route
                        path="*"
                        element={<Navigate to="/servers" replace />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
