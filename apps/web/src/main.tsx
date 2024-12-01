import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App.tsx';
import Login from './Login.tsx';

const root = createRoot(document.getElementById('root')!);

root.render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<App />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
