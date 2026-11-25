import type { Backend } from '@/shared/backend/backend';
import { localBackend } from '@/shared/backend/local/local-backend';
import { LocalExtras } from '@/shared/backend/local/ui/local-extras';

/**
 * The local build's backend: Vite aliases `@/shared/backend/implementation`
 * to this module in `--mode backendless`.
 */
export const backend: Backend = localBackend;

/** The slim local-mode bar above the app. */
export const BackendExtras = LocalExtras;
