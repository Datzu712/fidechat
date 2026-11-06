import './globals.css';
import '@fontsource-variable/inter';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from 'react-router';

import RootLayout from './root-layout';
import AuthLayout from './pages/auth-layout';
import LoginPage from './pages/login';
import ServersLayout from './pages/servers-layout';
import ServersPage from './pages/servers';
import ServerLayout from './pages/server-layout';
import ServerPage from './pages/server';
import ChannelPage from './pages/channel';

/** `/` goes through the login, keeping the query: a failed login comes back as `/?login_error=...`. */
function HomeRedirect() {
    const { search } = useLocation();
    return <Navigate to={{ pathname: '/login', search }} replace />;
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
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
    </StrictMode>,
);
