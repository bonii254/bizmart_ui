import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WarehouseService } from "../../services/warehouseService";
import { 
  Warehouse, 
  WarehousePayload, 
  UpdateWarehouseRequest 
} from "../../types/warehouse";

export const useWarehouses = () => {
  return useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: () => WarehouseService.getAllWarehouses(),
  });
};

export const useWarehouseDetails = (warehouseId?: string) => {
  return useQuery<Warehouse>({
    queryKey: ["warehouse", warehouseId],
    queryFn: () => WarehouseService.getWarehouseById(warehouseId!),
    enabled: !!warehouseId,
  });
};

export const useWarehouseMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: WarehousePayload) => 
      WarehouseService.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ 
      warehouseId, 
      data 
    }: { 
      warehouseId: string; 
      data: UpdateWarehouseRequest 
    }) => WarehouseService.updateWarehouse(warehouseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse", variables.warehouseId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (warehouseId: string) => 
      WarehouseService.deleteWarehouse(warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  return {
    createWarehouse: createMutation.mutateAsync,
    updateWarehouse: updateMutation.mutateAsync,
    deleteWarehouse: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};