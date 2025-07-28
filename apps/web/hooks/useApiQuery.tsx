'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    useQuery,
    useMutation,
    type UseQueryOptions,
} from '@tanstack/react-query';
import { ApiRequestOptions, useApi } from './useApi';
import { AxiosError } from 'axios';
import { useSession } from 'next-auth/react';

type UseApiDataOptions<K> = {
    queryOptions?: Omit<UseQueryOptions<K>, 'queryKey' | 'queryFn'>;
    apiRequestOptions?: ApiRequestOptions<K>;
    ignoreAuthenticated?: boolean;
};

/**
 * Custom React hook for fetching data from an API endpoint using Tanstack Query.
 *
 * @template K - The expected response data type.
 * @param {string} url - The API endpoint URL to fetch data from.
 * @param {UseApiDataOptions<K>} [options] - Optional configuration for the API request and React Query.
 * @param {ApiRequestOptions} [options.apiRequestOptions] - Options to pass to the API request.
 * @param {boolean} [options.ignoreAuthenticated] - If true, the query runs regardless of authentication status.
 * @param {UseQueryOptions<K>} [options.queryOptions] - Additional options for React Query's `useQuery`.
 * @returns {UseQueryResult<K>} The result object from React Query's `useQuery`, containing data, status, and error information.
 *
 * @example
 * const { data, isLoading } = useApiData<User[]>('/api/users');
 */
export const useApiData = <K = any,>(
    url: string,
    options?: UseApiDataOptions<K>,
) => {
    const { apiRequest } = useApi();
    const { status } = useSession();
    console.log(status);

    return useQuery({
        queryKey: [url, options],
        queryFn: () =>
            apiRequest(url, options?.apiRequestOptions) as Promise<K>,
        enabled: options?.ignoreAuthenticated
            ? true
            : status === 'authenticated',
        ...options?.queryOptions,
    });
};

/**
 * Custom React hook for performing POST mutations to a specified API endpoint.
 *
 * @template D - The type of the data to be sent in the mutation request.
 * @template R - The type of the response expected from the API.
 * @param {string} url - The API endpoint URL to which the mutation will be sent.
 * @returns {UseMutationResult<R, AxiosError, D>} - The mutation result object from React Query.
 *
 * @example
 * const mutation = useApiMutation<MyRequestType, MyResponseType>('/api/resource');
 * mutation.mutate({ foo: 'bar' });
 *
 * @remarks
 * This hook uses the `useApi` context to perform the request and handles errors by logging them to the console.
 */
export const useApiMutation = <D = any, R = any>(url: string) => {
    const { apiRequest } = useApi();

    return useMutation({
        mutationFn: (data: D) => {
            return apiRequest(url, {
                data,
                method: 'POST',
            }) as Promise<R>;
        },
        onError: (error: AxiosError) => {
            console.error(error);
        },
    });
};
