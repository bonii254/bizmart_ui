import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StockTakeService } from "../../services/stocktakeService";
import {
  CreateStockTakeRequest,
  CreateStockTakeResponse,
  StockTakeVarianceResponse,
} from "../../types/stocktake";
import { toast } from "react-toastify";

export const useStockTake = (stockTakeId?: string) => {
  const queryClient = useQueryClient();

  const varianceQuery = useQuery<StockTakeVarianceResponse>({
    queryKey: ["stockTakes", "variance", stockTakeId],
    queryFn: () => StockTakeService.getStockTakeVariance(stockTakeId!),
    enabled: !!stockTakeId,
    retry: false,
  });

  const createStockTakeMutation = useMutation<
    CreateStockTakeResponse,
    any,
    CreateStockTakeRequest
  >({
    mutationFn: (payload: CreateStockTakeRequest) =>
      StockTakeService.createStockTake(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["stockTakes"] });
      queryClient.invalidateQueries({ queryKey: ["stockBalances"] });
      toast.success(response.message || "Stock take created successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to create stock take transaction";
      toast.error(message);
    },
  });

  return {
    varianceData: varianceQuery.data?.data || [],
    varianceResponse: varianceQuery.data,

    isVarianceLoading: varianceQuery.isLoading,
    isVarianceError: varianceQuery.isError,
    varianceError: varianceQuery.error,

    isCreating: createStockTakeMutation.isPending,
    createStockTakeRecord: createStockTakeMutation.mutateAsync,
    refetchVariance: varianceQuery.refetch,
  };
};