'use client';

import { type AxiosRequestConfig } from 'axios';
import { useCallback } from 'react';
import { useToast } from '../../hooks/useToast';
import { useAxiosClient } from '../api/client';

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
export function useApi<R>() {
    const axiosClient = useAxiosClient(); // Usa el cliente preconfigurado
    const { toast } = useToast();

    const apiRequest = useCallback(
        async <K = R,>(
            url: string,
            options?: ApiRequestOptions<K>,
        ): Promise<K | undefined> => {
            try {
                console.debug(`[API REQ] ${url}`, options);
                const response = await axiosClient({
                    url,
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

                throw error;
            }
        },
        [axiosClient, toast],
    );

    return {
        apiRequest,
    };
}
