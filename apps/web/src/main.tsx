import 'bootstrap/dist/css/bootstrap.min.css';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { GlobalProvider } from './contexts/GlobalContext';

const App = lazy(() => import('./App.tsx'));
const Login = lazy(() => import('./Login.tsx'));

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <StrictMode>
        <GlobalProvider>
            <BrowserRouter>
                <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<App />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </GlobalProvider>
    </StrictMode>,
);
