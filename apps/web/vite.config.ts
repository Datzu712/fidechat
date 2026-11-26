import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defaultClientConditions, defineConfig } from 'vite';

// The API runs the login (BFF) and authenticates with a session cookie, so in dev the browser must
// see the web app and the API on one origin: Vite proxies /api and /socket.io to the API on 8080.
const API_URL = 'http://localhost:8080';

const src = (file: string) => path.resolve(import.meta.dirname, 'src', file);

// `--mode backendless` builds the app with no server: these aliases, listed
// before `@` so they win, swap in the local backend and its entry screen.
// (Vite reserves `local` as a mode name, for `.env.local` files.)
const LOCAL_ALIASES = {
    '@/shared/backend/implementation': src(
        'shared/backend/local/implementation.ts',
    ),
    '@/features/auth/pages/login-page': src(
        'features/auth/pages/local-login-page.tsx',
    ),
};

export default defineConfig(({ mode }) => ({
    plugins: [react(), tailwindcss()],
    resolve: {
        // onnxruntime-web's build without a bundled .wasm (27 MB): the model
        // library fetches its runtime binaries from jsDelivr instead.
        conditions:
            mode === 'backendless'
                ? [
                      'onnxruntime-web-use-extern-wasm',
                      ...defaultClientConditions,
                  ]
                : undefined,
        alias: {
            ...(mode === 'backendless' ? LOCAL_ALIASES : {}),
            '@': src(''),
        },
    },
    // The local server worker uses top-level await, which needs ES module workers.
    worker: { format: 'es' },
    server: {
        port: 3000,
        proxy: {
            '/api': API_URL,
            '/socket.io': { target: API_URL, ws: true },
        },
    },
}));
