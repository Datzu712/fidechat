'use client';

import axios from 'axios';
import { useSession, signIn } from 'next-auth/react';
import federatedLogout from '../federated-logout';

export function useAxiosClient() {
    const { data: session } = useSession();

    const axiosApiClient = axios.create({
        baseURL: `${process.env.NEXT_PUBLIC_REST_API_URL}/api/v1`,
        timeout: 10000,
    });

    axiosApiClient.interceptors.request.use(
        (config) => {
            if (session?.accessToken) {
                config.headers.Authorization = `Bearer ${session.accessToken}`;
            }
            return config;
        },
        (error) => Promise.reject(error),
    );

    axiosApiClient.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response?.status === 401) {
                console.debug(
                    '[Axios] Unauthorized, attempting reauthentication',
                );

                try {
                    await signIn('keycloak');
                } catch (error) {
                    console.error('[Axios] Sign-in failed, logging out', error);
                    federatedLogout();
                }
            }
            return Promise.reject(error);
        },
    );

    return axiosApiClient;
}
