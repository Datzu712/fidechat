import { useContext } from 'react';

import { AuthContext } from '@/features/auth/providers/auth-context';

export function useAuth() {
    return useContext(AuthContext);
}
