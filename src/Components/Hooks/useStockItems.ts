import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StockItemService } from "../../services/stockitemService"; 
import { 
  StockItem, 
  StockItemPayload, 
  UpdateStockItemRequest, 
  StockItemQueryParams 
} from "../../types/stockitem";

export const useStockItems = (params?: StockItemQueryParams) => {
  return useQuery<StockItem[]>({
    queryKey: ["stockItems", params],
    queryFn: () => StockItemService.listMasterCatalog(params),
  });
};

export const useStockItemDetails = (itemId?: string) => {
  return useQuery<StockItem>({
    queryKey: ["stockItem", itemId],
    queryFn: () => StockItemService.getMasterItemDetails(itemId!),
    enabled: !!itemId, 
  });
};

export const useStockItemByCode = (itemCode?: string) => {
  return useQuery<StockItem>({
    queryKey: ["stockItemCode", itemCode],
    queryFn: () => StockItemService.getMasterItemByCode(itemCode!),
    enabled: !!itemCode,
  });
};

export const useStockItemMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: StockItemPayload) => 
      StockItemService.createMasterStockItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockItems"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateStockItemRequest }) => 
      StockItemService.updateMasterStockItem(itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stockItems"] });
      queryClient.invalidateQueries({ queryKey: ["stockItem", variables.itemId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => 
      StockItemService.deleteMasterStockItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockItems"] });
    },
  });

  return {
    createStockItem: createMutation.mutateAsync,
    updateStockItem: updateMutation.mutateAsync,
    deleteStockItem: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};