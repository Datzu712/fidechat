import { type AxiosRequestConfig } from 'axios';
import { useCallback } from 'react';

import { apiClient } from '@/shared/api/client';
import { useToast } from '@/shared/ui/use-toast';

export interface ApiRequestOptions<T> extends AxiosRequestConfig<T> {
    displayError?: boolean;
}

/**
 * Requests to the API through the same-origin client (the session cookie
 * authenticates them). With `displayError`, a failure also shows a toast.
 */
export function useApi<R>() {
    const axiosClient = apiClient;
    const { toast } = useToast();

    const apiRequest = useCallback(
        async <K = R>(
            url: string,
            options?: ApiRequestOptions<K>,
        ): Promise<K | undefined> => {
            try {
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
