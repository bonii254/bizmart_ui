import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StockItemService } from "../../services/stockitemService"; 
import { StockItemPayload, UpdateStockItemRequest } from "../../types/stockitem";


export const useStockItems = (search?: string, activeOnly?: boolean) => {
  return useQuery({
    queryKey: ["stockItems", search, activeOnly],
    queryFn: () => StockItemService.listMasterCatalog(search, activeOnly),
  });
};

export const useStockItemDetails = (id: string) => {
  return useQuery({
    queryKey: ["stockItem", id],
    queryFn: () => StockItemService.getMasterItemDetails(id),
    enabled: !!id, 
  });
};

export const useStockItemBalances = (id: string) => {
  return useQuery({
    queryKey: ["stockItemBalances", id],
    queryFn: () => StockItemService.getStockItemGlobalBalances(id),
    enabled: !!id,
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
    mutationFn: ({ id, data }: { id: string; data: UpdateStockItemRequest }) => 
      StockItemService.updateMasterStockItem(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stockItems"] });
      queryClient.invalidateQueries({ queryKey: ["stockItem", variables.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      StockItemService.deleteMasterStockItem(id),
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