import type { ReactNode } from 'react';

import type { Backend } from '@/shared/backend/backend';
import { httpBackend } from '@/shared/backend/http/http-backend';

/** The backend the app talks to. Features import it only through this module. */
export const backend: Backend = httpBackend;

/** UI the backend adds above the app. The real backend adds none. */
export function BackendExtras(): ReactNode {
    return null;
}
