import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CashWithdrawalService } from "../../services/cashWithdrawalService";
import { CashWithdrawalPayload } from "../../types/cashWithdrawal";
import { toast } from "react-toastify";

export const useCashWithdrawals = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: ["cash-withdrawals", filters],
    queryFn: () => CashWithdrawalService.getWithdrawals(filters),
  });
};

export const useCashWithdrawalMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CashWithdrawalPayload) => CashWithdrawalService.createWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-withdrawals"] });
      toast.success("Cash withdrawal posted successfully from till balance");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process cash withdrawal");
    },
  });

  return {
    createWithdrawal: createMutation.mutateAsync,
    isPosting: createMutation.isPending,
  };
};

export const useBanks = () => {
  return useQuery({
    queryKey: ["banks-list"],
    queryFn: async () => [
      { id: 'BANK-001', name: 'KCB Bank — Main Till' },
      { id: 'BANK-002', name: 'Equity Bank — Operational Account' },
      { id: 'BANK-003', name: 'Cooperative Bank — Reserve' }
    ]
  });
};

export const useOperators = () => {
  return useQuery({
    queryKey: ["operators-list"],
    queryFn: async () => [
      { id: 'OP-001', name: 'CASHIER01' },
      { id: 'OP-002', name: 'SUPERVISOR_MAIN' },
      { id: 'OP-003', name: 'MANAGER_KAPS' }
    ]
  });
};