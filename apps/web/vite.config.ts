import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// The API runs the login (BFF) and authenticates with a session cookie, so in dev the browser must
// see the web app and the API on one origin: Vite proxies /api and /socket.io to the API on 8080.
const API_URL = 'http://localhost:8080';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: { '@': path.resolve(import.meta.dirname, 'src') },
    },
    server: {
        port: 3000,
        proxy: {
            '/api': API_URL,
            '/socket.io': { target: API_URL, ws: true },
        },
    },
});
