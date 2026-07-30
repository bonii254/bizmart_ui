import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { APIClient } from "../../helpers/api_helper";
import { toast } from "react-toastify";


const api = new APIClient();

export const useLogin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (credentials: any ) =>  api.create('/login', credentials),
        onSuccess: (data) => {
            sessionStorage.setItem("authUser", JSON.stringify(data));
            queryClient.setQueryData(['authUser'], data.user);
        },
        onError: (error: any) => {
            toast.error(error.toString());
        }
    });
};


export const useUser = () => {
    return useQuery({
        queryKey: ['authUser'],
        queryFn: async () => {
            const response = await api.get("auth/me");
            return response.user;
        },
        retry: false,
        refetchOnWindowFocus: false,
    });
};