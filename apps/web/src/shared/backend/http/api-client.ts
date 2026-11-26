import axios from 'axios';

import { toBackendError } from '@/shared/backend/http/to-backend-error';

/**
 * Same-origin client for the API: the browser sends the BFF session cookie by itself, so there is
 * no token to attach. A 401 means the session is gone, so the user goes back through the login.
 * Every failure rejects with a BackendError.
 */
export const apiClient = axios.create({
    baseURL: '/api/v1',
    timeout: 10000,
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            window.location.href = '/login';
        }
        return Promise.reject(toBackendError(error));
    },
);
