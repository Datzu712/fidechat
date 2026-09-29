import { createDefaultPreset, pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';
import type { Config } from 'jest';

const tsJestTransformCfg = createDefaultPreset().transform;

const config: Config = {
    testEnvironment: 'node',
    transform: {
        ...tsJestTransformCfg,
    },
    testMatch: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    // tsconfig ya no define `baseUrl` (tsgolint no lo soporta), asi que los
    // paths son relativos al tsconfig y jest los ancla con el prefijo.
    modulePaths: ['<rootDir>'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    forceExit: true, // todo: remove this when jest issue is resolved
};

export default config;
