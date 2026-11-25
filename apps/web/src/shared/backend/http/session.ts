import type { AuthMe } from '@fidechat/shared';

import type { SessionBackend } from '@/shared/backend/backend';

export const sessionBackend: SessionBackend = {
    async getSession() {
        try {
            const response = await fetch('/api/v1/auth/me');
            if (!response.ok) return null;
            return (await response.json()) as AuthMe;
        } catch {
            return null;
        }
    },

    /**
     * Ends the BFF session, then sends the browser to Keycloak's end-session URL so the SSO
     * session ends too.
     */
    async logout() {
        const response = await fetch('/api/v1/auth/logout', { method: 'POST' });
        const data = (await response.json()) as { url?: string };
        if (!response.ok || !data.url) throw new Error('Logout failed');
        window.location.href = data.url;
    },
};
