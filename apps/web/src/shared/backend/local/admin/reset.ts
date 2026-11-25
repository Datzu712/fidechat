import type { LocalBackend } from '@/shared/backend/local/local-backend';
import { request } from '@/shared/backend/local/tab/replica/server-link';

export const resetAdmin: Pick<LocalBackend, 'resetDemo'> = {
    async resetDemo() {
        await request<null>({ op: 'reset' });
    },
};
