import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleService } from "../../services/roleService";
import {
  CreateRolePayload,
  UpdateRolePayload,
  SaveRoleAccessPayload,
  DeleteRoleAccessParams,
} from "../../types/role";
import { toast } from "react-toastify";

export const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => roleService.getRoles(),
  });
};

export const useRole = (roleId: string) => {
  return useQuery({
    queryKey: ["roles", roleId],
    queryFn: () => roleService.getRoleById(roleId),
    enabled: !!roleId,
  });
};

export const useRoleAccess = (roleId: string) => {
  return useQuery({
    queryKey: ["roles", roleId, "access"],
    queryFn: () => roleService.getRoleAccess(roleId),
    enabled: !!roleId,
  });
};

export const useRoleMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateRolePayload) => roleService.createRole(data),
    onSuccess: (response) => {
      toast.success(response.message || "Role created successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to create role";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateRolePayload }) =>
      roleService.updateRole(roleId, data),
    onSuccess: (response, variables) => {
      toast.success(response.message || "Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to update role";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => roleService.deleteRole(roleId),
    onSuccess: (response) => {
      toast.success(response.message || "Role deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to delete role";
      toast.error(message);
    },
  });

  const saveAccessMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: SaveRoleAccessPayload }) =>
      roleService.saveRoleAccess(roleId, data),
    onSuccess: (response, variables) => {
      toast.success(response.message || "Role permissions saved successfully");
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "access"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to save role permissions";
      toast.error(message);
    },
  });

  const deleteAccessMutation = useMutation({
    mutationFn: (params: DeleteRoleAccessParams) => roleService.deleteRoleAccess(params),
    onSuccess: (response, variables) => {
      toast.success(response.message || "Role permission removed successfully");
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "access"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to remove role permission";
      toast.error(message);
    },
  });

  return {
    createRole: createMutation.mutateAsync,
    updateRole: updateMutation.mutateAsync,
    deleteRole: deleteMutation.mutateAsync,
    saveRoleAccess: saveAccessMutation.mutateAsync,
    deleteRoleAccess: deleteAccessMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSavingAccess: saveAccessMutation.isPending,
    isDeletingAccess: deleteAccessMutation.isPending,
  };
};