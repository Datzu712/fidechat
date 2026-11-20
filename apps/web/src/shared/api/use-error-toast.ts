import { useCallback } from 'react';

import { parseAxiosError } from '@/shared/api/parse-axios-error';
import { useToast } from '@/shared/ui/use-toast';

/** An `onError` for mutations: a destructive toast with the API's message. */
export function useErrorToast(title: string) {
    const { toast } = useToast();
    return useCallback(
        (error: unknown) =>
            toast({
                variant: 'destructive',
                title,
                description: parseAxiosError(error),
            }),
        [toast, title],
    );
}
