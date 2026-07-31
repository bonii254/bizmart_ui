import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomerService } from "../../services/customerService";
import { CustomerPayload, UpdateUserRequest } from "../../types/customer";
import { toast } from "react-toastify";

export const useCustomers = (page: number = 1, perPage: number = 10) => {
  return useQuery({
    queryKey: ["customers", page, perPage],
    queryFn: () => CustomerService.getAllCustomers(page, perPage),
  });
};

export const useCustomerDetails = (id: number) => {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => CustomerService.getCustomerById(id),
    enabled: !!id,
  });
};

export const useCustomerMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CustomerPayload) => CustomerService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create customer");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      CustomerService.updateCustomer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", variables.id] });
      toast.success("Customer updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update customer");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => CustomerService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete customer");
    },
  });

  return {
    createCustomer: createMutation.mutateAsync,
    updateCustomer: updateMutation.mutateAsync,
    deleteCustomer: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};