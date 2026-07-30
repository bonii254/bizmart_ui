import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserService } from "../../services/userService";
import { UserPayload, UpdateUserRequest } from "../../types/user";
import { toast } from "react-toastify";

export const useUsers = (page: number, perPage: number) => {
  return useQuery({
    queryKey: ["users", page, perPage],
    queryFn: () => UserService.getAllUsers(page, perPage),
  });
};


export const useUserMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: UserPayload) => UserService.createUser(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) => 
      UserService.updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: { email: string }) => UserService.forgetUserPassword(data as any),
    onSuccess: (response) => {
      toast.success(response.message || "Recovery email sent successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to process request";
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => UserService.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return {
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};