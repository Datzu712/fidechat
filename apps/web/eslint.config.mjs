import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
    recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
    js.configs.recommended,
    ...compat.config({
        parser: '@typescript-eslint/parser',
        extends: [
            'next',
            'prettier',
            'next/core-web-vitals',
            'plugin:@tanstack/eslint-plugin-query/recommended',
            'plugin:@typescript-eslint/recommended',
        ],
        plugins: ['react-hooks', 'react-refresh', '@tanstack/query'],
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react-refresh/only-export-components': 'warn',
        },
    }),
    {
        ignores: ['node_modules/**', '.next/**', 'out/**'],
    },
];

export default eslintConfig;
