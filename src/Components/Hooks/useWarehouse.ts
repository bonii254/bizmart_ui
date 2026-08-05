import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WarehouseService } from "../../services/warehouseService";
import { WarehousePayload, UpdateWarehouseRequest } from "../../types/warehouse";

export const useWarehouses = (active?: boolean) => {
  return useQuery({
    queryKey: ["warehouses", active],
    queryFn: () => WarehouseService.getAllWarehouses(active),
  });
}

export const useWarehouseMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (warehouse: WarehousePayload) => WarehouseService.createWarehouse(warehouse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WarehousePayload> }) => 
        WarehouseService.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => WarehouseService.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  return { 
    createMutation: createMutation.mutateAsync, 
    updateMutation: updateMutation.mutateAsync, 
    deleteMutation: deleteMutation.mutateAsync 
  };
};