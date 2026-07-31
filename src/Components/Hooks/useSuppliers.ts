import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SupplierService } from "../../services/supplierService";
import { SupplierPayload, UpdateSupplierRequest } from "../../types/supplier";
import { toast } from "react-toastify";

export const useSuppliers = (page: number = 1, perPage: number = 100) => {
  return useQuery({
    queryKey: ["suppliers", page, perPage],
    queryFn: () => SupplierService.getSuppliers(page, perPage),
  });
};

export const useSupplierDetails = (id: string | null) => {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => SupplierService.getSupplierById(id!),
    enabled: !!id,
  });
};

export const useSupplierMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: SupplierPayload) => SupplierService.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create supplier");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierRequest }) =>
      SupplierService.updateSupplier(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers", variables.id] });
      toast.success("Supplier updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update supplier");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => SupplierService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete supplier");
    },
  });

  return {
    createSupplier: createMutation.mutateAsync,
    updateSupplier: updateMutation.mutateAsync,
    deleteSupplier: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};