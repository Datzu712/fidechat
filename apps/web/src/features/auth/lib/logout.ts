import { errorMessage } from '@/shared/api/error-message';
import { backend } from '@/shared/backend/implementation';
import { toast } from '@/shared/ui/use-toast';

/** Calls backend.logout() and toasts when it fails. */
export async function logout() {
    try {
        await backend.logout();
    } catch {
        toast({
            variant: 'destructive',
            title: 'Could not log out',
            description: errorMessage(undefined),
        });
    }
}
