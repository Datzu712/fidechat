import { useGetAxiosClient } from '../client';

export function useApiServices() {
    const axiosClient = useGetAxiosClient();

    const getCurrentUserGuilds = async (userId: string) => {
        const response = await axiosClient.get(`/users/${userId}`);
        return response.data;
    };

    return {
        getCurrentUserGuilds,
    };
}
