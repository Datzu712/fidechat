import { useEffect } from 'react';
import { useNavigate } from 'react-router';

const useAuth = (
    setIsAuthenticated: (isAuthenticated: boolean) => void,
    navigate: ReturnType<typeof useNavigate>,
) => {
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(
                    import.meta.env.VITE_API_URL + '/api/auth/verifyToken',
                    {
                        method: 'POST',
                        credentials: 'include',
                    },
                );

                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Failed to verify token', error);
                navigate('/login');
            }
        };

        checkAuth();
    }, [navigate, setIsAuthenticated]);
};

export default useAuth;
