import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CompanyService } from "../../services/companiesService";
import { CompanyPayload, UpdateCompanyRequest } from "../../types/companies";
import { toast } from "react-toastify";

export const useCompanies = () => {
  return useQuery({
    queryKey: ["companies"],
    queryFn: () => CompanyService.getAllCompanies(),
  });
};

export const useCompanyMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CompanyPayload) => CompanyService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to process company request ");
        },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyRequest }) =>
      CompanyService.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => CompanyService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  return {
    createCompany: createMutation.mutateAsync,
    updateCompany: updateMutation.mutateAsync,
    deleteCompany: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};