import axios from 'axios';

/**
 * Same-origin client for the API: the browser sends the BFF session cookie by itself, so there is
 * no token to attach. A 401 means the session is gone, so the user goes back through the login.
 */
export const apiClient = axios.create({
    baseURL: '/api/v1',
    timeout: 10000,
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.debug('[Axios] Unauthorized, sending the user to login');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);
