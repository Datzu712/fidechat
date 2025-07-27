'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import federatedLogout from '@/lib/federated-logout';
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import { useToast } from './useToast';
import { useRouter } from 'next/router';

export interface ApiRequestOptions<T> extends AxiosRequestConfig<T> {
    displayError?: boolean;
}

/**
 * Custom hook for making authenticated API requests.
 *
 * This hook provides a function to make HTTP requests to the backend API with
 * authentication headers automatically included. It also handles common error
 * scenarios like unauthorized access (401) by triggering logout.
 *
 * @remarks
 * The hook depends on session data from `useSession` to obtain the access token
 * for authentication and `useToast` for displaying error notifications.
 *
 * @returns An object containing:
 * - `apiRequest` - A function to make authenticated API requests
 * - `isAuthenticated` - A boolean indicating if the user is authenticated
 *
 * @example
 * ```tsx
 * const { apiRequest, isAuthenticated } = useApi();
 *
 * // Fetch data example
 * const fetchData = async () => {
 *   const data = await apiRequest<DataType>('/endpoint', { method: 'GET' });
 *   // Process data
 * };
 * ```
 */
export function useApi() {
    const { data, status } = useSession();
    const { toast } = useToast();
    const router = useRouter();

    const apiRequest = useCallback(
        async <K = any,>(
            url: string,
            options?: ApiRequestOptions<K>,
        ): Promise<K | undefined> => {
            if (status === 'unauthenticated') {
                router.push('/login');
                return;
            }

            if (status === 'loading') {
                console.debug('[API REQ] Session is loading, skipping request');
                return;
            }

            console.debug(`[API REQ] ${url}`, options);
            try {
                const response = await axios({
                    url: `${process.env.NEXT_PUBLIC_REST_API_URL}/api${url}`,
                    headers: {
                        Authorization: `Bearer ${data?.accessToken}`,
                    },
                    ...options,
                });
                return response.data as K;
            } catch (error) {
                if (options?.displayError) {
                    toast({
                        title: 'Error',
                        description:
                            'An error occurred while processing your request.',
                        duration: 5000,
                    });
                }

                if (
                    error instanceof AxiosError &&
                    [401].includes(error.response?.status as number)
                ) {
                    console.debug('[API REQ] Unauthorized');
                    federatedLogout();
                } else {
                    throw error;
                }
            }
        },
        [data?.accessToken, status],
    );

    return {
        apiRequest,
    };
}
