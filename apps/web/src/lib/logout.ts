/**
 * Ends the BFF session, then sends the browser to Keycloak's end-session URL so the SSO session
 * ends too.
 */
export default async function logout() {
    try {
        const response = await fetch('/api/v1/auth/logout', { method: 'POST' });
        const data = (await response.json()) as { url?: string };
        if (!response.ok || !data.url) throw new Error('Logout failed');
        window.location.href = data.url;
    } catch (error) {
        console.error('Logout error:', error);
        alert(
            'Ha ocurrido un error durante el cierre de sesión. Por favor, inténtalo de nuevo.',
        );
    }
}
