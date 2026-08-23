import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BankService } from "../../services/bankService";
import { Bank, BankPayload, UpdateBankRequest } from "../../types/bank";
import { toast } from "react-toastify";

export const useBanks = () => {
  return useQuery<Bank[]>({
    queryKey: ["banks"],
    queryFn: async () => {
      const res = await BankService.getBanks();
      return res.data ?? [];
    },
  });
};

export const useBankDetails = (id: string | null) => {
  return useQuery<Bank | null>({
    queryKey: ["banks", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await BankService.getBankById(id);
      return res.data ?? null;
    },
    enabled: !!id,
  });
};

export const useBankMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: BankPayload) => BankService.createBank(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Bank created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create bank");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBankRequest }) =>
      BankService.updateBank(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      queryClient.invalidateQueries({ queryKey: ["banks", variables.id] });
      toast.success("Bank updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update bank");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => BankService.deleteBank(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Bank deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete bank");
    },
  });

  return {
    createBank: createMutation.mutateAsync,
    updateBank: updateMutation.mutateAsync,
    deleteBank: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};