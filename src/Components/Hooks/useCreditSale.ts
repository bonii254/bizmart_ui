import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditSalesService } from "../../services/creditSaleService";
import { CreateCreditSaleRequest } from "../../types/creditSale";
import { toast } from "react-toastify";

export const useCreditSalesMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (
        data: CreateCreditSaleRequest
    ) => CreditSalesService.createCreditSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["sales-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["itemWarehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouseItems"] });
      toast.success("Credit sale completed successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to process credit sale");
    },
  });

  return {
    processCreditSale: createMutation.mutateAsync,
    isPosting: createMutation.isPending,
  };
};