import { signOut } from 'next-auth/react';

export default async function federatedLogout() {
    try {
        await signOut({ redirect: false });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/api/auth/federated-logout', {
            signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await response.json();

        if (response.ok && data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Logout backend failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert(
            'Ha ocurrido un error durante el cierre de sesión. Por favor, inténtalo de nuevo.',
        );
        window.location.href = '/login';
    }
}
