import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CashMovementService } from "../../services/transactionService";
import { CreateCashMovementRequest } from "../../types/transactions";
import { toast } from "react-toastify";

export const useCashMovementMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateCashMovementRequest) =>
      CashMovementService.createCashMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-movements"] });
      queryClient.invalidateQueries({ queryKey: ["bank-balances"] });
      queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
      toast.success("Cash movement processed successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to process cash movement"
      );
    },
  });

  return {
    createCashMovement: createMutation.mutateAsync,
    isPosting: createMutation.isPending,
  };
};