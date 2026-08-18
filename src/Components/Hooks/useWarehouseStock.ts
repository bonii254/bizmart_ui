import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from "@tanstack/react-query";
import { 
  ItemWarehouseService 
} from "../../services/warehouseStockService";
import { 
  ItemWarehouseStock,
  AssignWarehouseToItemRequest 
} from "../../types/warehouseStock";
import { toast } from "react-toastify";

interface UseItemWarehouseStockParams {
  itemId?: string;
  warehouseId?: string;
}

export const useItemWarehouseStock = (
  param?: string | UseItemWarehouseStockParams,
  directWarehouseId?: string
) => {
  const queryClient = useQueryClient();

  const itemId = typeof param === "string" ? param : param?.itemId;
  const warehouseId = typeof param === "object" ? param?.warehouseId : directWarehouseId;

  const itemWarehousesQuery = useQuery<ItemWarehouseStock[]>({
    queryKey: ["itemWarehouses", itemId],
    queryFn: () => ItemWarehouseService.getItemWarehouses(itemId!),
    enabled: !!itemId,
  });

  const warehouseItemsQuery = useQuery<ItemWarehouseStock[]>({
    queryKey: ["warehouseItems", warehouseId],
    queryFn: () => ItemWarehouseService.getWarehouseItems(warehouseId!),
    enabled: !!warehouseId,
  });

  const assignWarehouse = useMutation({
    mutationFn: ({ 
      itemId: targetItemId, 
      payload 
    }: { 
      itemId: string; 
      payload: AssignWarehouseToItemRequest 
    }) => ItemWarehouseService.assignWarehouseToItem(targetItemId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itemWarehouses"] });
      queryClient.invalidateQueries({ queryKey: ["itemWarehouses", variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ["warehouseItems"] });
      if (variables.payload.warehouseId) {
        queryClient.invalidateQueries({
          queryKey: ["warehouseItems", variables.payload.warehouseId],
        });
      }
      toast.success("Warehouse assigned successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error.message || "Failed to assign warehouse"
      );
    },
  });

  const removeWarehouse = useMutation({
    mutationFn: ({ 
      itemId: targetItemId, 
      warehouseId: targetWarehouseId 
    }: { 
      itemId: string; 
      warehouseId: string 
    }) => ItemWarehouseService.removeItemWarehouse(targetItemId, targetWarehouseId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itemWarehouses"] });
      queryClient.invalidateQueries({ queryKey: ["itemWarehouses", variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ["warehouseItems"] });
      queryClient.invalidateQueries({
        queryKey: ["warehouseItems", variables.warehouseId],
      });
      toast.info("Warehouse link removed successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error.message || "Failed to remove warehouse link"
      );
    },
  });

  return {
    warehouses: itemWarehousesQuery.data || [],
    warehouseItems: warehouseItemsQuery.data || [],
    stockItems: warehouseItemsQuery.data || itemWarehousesQuery.data || [],

    isLoading: itemWarehousesQuery.isLoading || warehouseItemsQuery.isLoading,
    isFetching: itemWarehousesQuery.isFetching || warehouseItemsQuery.isFetching,
    isAssigning: assignWarehouse.isPending,
    isRemoving: removeWarehouse.isPending,

    assignWarehouse: assignWarehouse.mutateAsync,
    removeWarehouse: removeWarehouse.mutateAsync,
    refetchWarehouses: itemWarehousesQuery.refetch,
    refetchWarehouseItems: warehouseItemsQuery.refetch,
  };
};