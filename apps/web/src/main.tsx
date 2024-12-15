import '@scss/default.scss';

import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { GlobalProvider } from './contexts/GlobalContext';

const App = lazy(() => import('./pages/App.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const SignUp = lazy(() => import('./pages/SingUp.tsx'));
const NotFound = lazy(() => import('./pages/NotFound.tsx'));

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <StrictMode>
        <GlobalProvider>
            <BrowserRouter>
                <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<SignUp />} />
                        <Route path="/" element={<App />} />
                        <Route path="/*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </GlobalProvider>
    </StrictMode>,
);
