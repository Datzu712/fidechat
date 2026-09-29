import { createDefaultPreset, pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from './tsconfig.json' with { type: 'json' };
import type { Config } from 'jest';

// Jest carga este archivo con el type stripping nativo de Node, que exige el
// atributo `type: 'json'` para importar JSON.
const { compilerOptions } = tsconfig;

// TS 6 exige `rootDir` explicito. Se pasa solo a ts-jest: ponerlo en
// tsconfig.json haria que nest build emita dist/src/main.js.
const tsJestTransformCfg = createDefaultPreset({ tsconfig: { rootDir: '.' } }).transform;

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
