import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from "@tanstack/react-query";
import { 
  WarehouseStockService 
} from "../../services/warehouseStockService";
import { 
  InitializeStockPayload, 
  UpdateStockQtyPayload 
} from "../../types/warehouseStock";
import { toast } from "react-toastify";

export const useWarehouseStock = (warehouseId?: string, stockId?: string) => {
  const queryClient = useQueryClient();

  const allBalances = useQuery({
    queryKey: ["stockBalances", "list", warehouseId],
    queryFn: () => WarehouseStockService.getAllBalances(warehouseId),
  });

  const singleBalance = useQuery({
    queryKey: ["stockBalances", "detail", stockId],
    queryFn: () => WarehouseStockService.getBalance(stockId!),
    enabled: !!stockId,
    retry: false,
  });

  const initializeStock = useMutation({
    mutationFn: (payload: InitializeStockPayload) => 
      WarehouseStockService.initializeStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockBalances"] });
      toast.success("Stock balance initialized successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to initialize stock balance");
    }
  });

  const adjustStock = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStockQtyPayload }) => 
      WarehouseStockService.adjustStock(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockBalances"] });
      toast.success("Stock quantities updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to adjust stock quantities");
    }
  });

  const removeStockLink = useMutation({
    mutationFn: (id: string) => 
      WarehouseStockService.removeStockLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockBalances"] });
      toast.info("Stock record connection removed");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove stock record");
    }
  });

  return {
    balances: allBalances.data || [],
    currentBalance: singleBalance.data || null,

    isLoading: allBalances.isLoading || singleBalance.isLoading,
    isInitializing: initializeStock.isPending,
    isAdjusting: adjustStock.isPending,
    isRemoving: removeStockLink.isPending,

    initializeBalance: initializeStock.mutateAsync,
    modifyStockQty: adjustStock.mutateAsync,
    deleteStockLink: removeStockLink.mutateAsync
  };
};