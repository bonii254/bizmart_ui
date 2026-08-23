import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { POSService } from "../../services/posService";
import { CreateSalesReceiptPayload, SalesTransactionQueryParams } from "../../types/POS"; 
import { toast } from "react-toastify";

export const useSales = () => {
  return useQuery({
    queryKey: ["pos-sales"],
    queryFn: () => POSService.getSales(),
  });
};

export const useSaleDetails = (id: string | null) => {
  return useQuery({
    queryKey: ["pos-sales", id],
    queryFn: () => POSService.getSaleById(id!),
    enabled: !!id,
  });
};

export const useSalesTransactions = (params?: SalesTransactionQueryParams) => {
  return useQuery({
    queryKey: ["sales-transactions", params],
    queryFn: () => POSService.getSalesTransactions(params),
  });
};

export const usePOSMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateSalesReceiptPayload) => POSService.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] }); 
      queryClient.invalidateQueries({ queryKey: ["sales-transactions"] });
      toast.success("Sale completed successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process sale");
    },
  });

  return {
    processSale: createMutation.mutateAsync,
    isPosting: createMutation.isPending,
  };
};