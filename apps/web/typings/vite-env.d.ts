/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    VITE_API_URL: string;
    VITE_WS_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
