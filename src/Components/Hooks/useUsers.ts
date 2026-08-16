import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OperatorService } from "../../services/userService";
import {
  OperatorPayload,
  UpdateOperatorPayload,
  CreateOperatorPasswordPayload,
  CreateOperatorPasswordResponse,
  OperatorListResponse,
  SingleOperatorResponse,
  OperatorMutationResponse,
} from "../../types/user";
import { toast } from "react-toastify";

export const useOperators = () => {
  return useQuery<OperatorListResponse, Error>({
    queryKey: ["operators"],
    queryFn: () => OperatorService.getAllOperators(),
  });
};

export const useOperatorById = (id: string) => {
  return useQuery<SingleOperatorResponse, Error>({
    queryKey: ["operators", id],
    queryFn: () => OperatorService.getOperatorById(id),
    enabled: !!id,
  });
};

export const useOperatorByCode = (operatorCode: string) => {
  return useQuery<SingleOperatorResponse, Error>({
    queryKey: ["operators", "code", operatorCode],
    queryFn: () => OperatorService.getOperatorByCode(operatorCode),
    enabled: !!operatorCode,
  });
};

export const useOperatorMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation<OperatorMutationResponse, Error, OperatorPayload>({
    mutationFn: (data: OperatorPayload) => OperatorService.createOperator(data),
    onSuccess: (response) => {
      toast.success(response.message || "Operator created successfully");
      queryClient.invalidateQueries({ queryKey: ["operators"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to create operator";
      toast.error(message);
    },
  });

  const updateMutation = useMutation<
    OperatorMutationResponse,
    Error,
    { id: string; data: UpdateOperatorPayload }
  >({
    mutationFn: ({ id, data }) => OperatorService.updateOperator(id, data),
    onSuccess: (response, variables) => {
      toast.success(response.message || "Operator updated successfully");
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      queryClient.invalidateQueries({ queryKey: ["operators", variables.id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to update operator";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation<OperatorMutationResponse, Error, string>({
    mutationFn: (id: string) => OperatorService.deleteOperator(id),
    onSuccess: (response) => {
      toast.success(response.message || "Operator deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["operators"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to delete operator";
      toast.error(message);
    },
  });

  const createPasswordMutation = useMutation<
    CreateOperatorPasswordResponse,
    Error,
    { operatorId: string; payload: CreateOperatorPasswordPayload }
  >({
    mutationFn: ({ operatorId, payload }) =>
      OperatorService.createOperatorPassword(operatorId, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Password created successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to create password";
      toast.error(message);
    },
  });

  return {
    // Mutation Handlers
    createOperator: createMutation.mutateAsync,
    updateOperator: updateMutation.mutateAsync,
    deleteOperator: deleteMutation.mutateAsync,
    createOperatorPassword: createPasswordMutation.mutateAsync,

    // Raw Mutation Objects
    createMutation,
    updateMutation,
    deleteMutation,
    createPasswordMutation,

    // Loading States
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCreatingPassword: createPasswordMutation.isPending,
  };
};