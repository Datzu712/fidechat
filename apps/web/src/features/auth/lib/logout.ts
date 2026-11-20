import { toast } from '@/shared/ui/use-toast';

/**
 * Ends the BFF session, then sends the browser to Keycloak's end-session URL so the SSO session
 * ends too.
 */
export async function logout() {
    try {
        const response = await fetch('/api/v1/auth/logout', { method: 'POST' });
        const data = (await response.json()) as { url?: string };
        if (!response.ok || !data.url) throw new Error('Logout failed');
        window.location.href = data.url;
    } catch {
        toast({
            variant: 'destructive',
            title: 'Could not log out',
            description: 'Something went wrong. Please try again.',
        });
    }
}
