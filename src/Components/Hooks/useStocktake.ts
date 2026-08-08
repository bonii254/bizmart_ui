import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from "@tanstack/react-query";
import { StockTakeService } from "../../services/stocktakeService";
import { 
  CreateStockTakePayload, 
  UpdateStockTakePayload, 
  PostStockTakePayload 
} from "../../types/stocktake";
import { toast } from "react-toastify";

export const useStockTake = (
  warehouseId?: string,
  stockTakeId?: string
) => {
  const queryClient = useQueryClient();

  const paginatedStockTakes = useQuery({
    queryKey: ["stockTakes", "list", warehouseId],
    queryFn: () => StockTakeService.getPaginatedStockTakes(warehouseId),
  });

  const singleStockTake = useQuery({
    queryKey: ["stockTakes", "detail", stockTakeId],
    queryFn: () => StockTakeService.getStockTake(stockTakeId!),
    enabled: !!stockTakeId,
    retry: false,
  });

  const createStockTake = useMutation({
    mutationFn: (payload: CreateStockTakePayload) => 
      StockTakeService.createStockTake(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["stockTakes"] });
      toast.success(response.message || "Stock take record created successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to create stock take";
      toast.error(message);
    },
  });

  const updateStockTake = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStockTakePayload }) => 
      StockTakeService.updateStockTake(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["stockTakes"] });
      toast.success(response.message || "Stock take updated successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to update stock take";
      toast.error(message);
    },
  });

  const postStockTake = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: PostStockTakePayload }) => 
      StockTakeService.postStockTake(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["stockTakes"] });
      queryClient.invalidateQueries({ queryKey: ["stockBalances"] });
      toast.success(response.message || "Stock take posted and inventory updated!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to post stock take transaction";
      toast.error(message);
    },
  });

  const cancelStockTake = useMutation({
    mutationFn: (id: string) => StockTakeService.cancelStockTake(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["stockTakes"] });
      toast.info(response.message || "Stock take session cancelled");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to cancel stock take";
      toast.error(message);
    },
  });

  return {
    stockTakes: paginatedStockTakes.data?.data?.items || [],
    paginationMeta: {
      total: paginatedStockTakes.data?.data?.total || 0,
      page: paginatedStockTakes.data?.data?.page || 1,
      perPage: paginatedStockTakes.data?.data?.per_page || 10,
      pages: paginatedStockTakes.data?.data?.pages || 1,
    },
    currentStockTake: singleStockTake.data?.data || null,

    isLoading: paginatedStockTakes.isLoading || singleStockTake.isLoading,
    isCreating: createStockTake.isPending,
    isUpdating: updateStockTake.isPending,
    isPosting: postStockTake.isPending,
    isCancelling: cancelStockTake.isPending,

    createStockTakeRecord: createStockTake.mutateAsync,
    updateStockTakeRecord: updateStockTake.mutateAsync,
    postStockTakeRecord: postStockTake.mutateAsync,
    cancelStockTakeRecord: cancelStockTake.mutateAsync,
  };
};