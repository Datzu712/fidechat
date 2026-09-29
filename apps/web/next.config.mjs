import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Estamos dentro de un monorepo: apunta el file tracing a la raíz para que
    // Next no infiera mal el workspace root al resolver dependencias hoisteadas.
    outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
