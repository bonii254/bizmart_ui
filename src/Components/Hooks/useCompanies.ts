import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CompanyService } from "../../services/companiesService";
import { CompanyPayload, UpdateCompanyRequest } from "../../types/companies";

export const useCompanies = (active?: boolean) => {
  return useQuery({
    queryKey: ["companies", active],
    queryFn: () => CompanyService.getAllCompanies(active),
  });
};

export const useCompanyMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CompanyPayload) => CompanyService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
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