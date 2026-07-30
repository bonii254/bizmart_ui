import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CoolerService } from "../../services/coolerService";
import { CoolerPayload, UpdateCoolerRequest } from "../../types/cooler";

export const useCoolers = (active?: boolean) => {
  return useQuery({
    queryKey: ["coolers", active],
    queryFn: () => CoolerService.getAllCoolers(active),
  });
};

export const useCoolerMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CoolerPayload) => CoolerService.createCooler(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coolers"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCoolerRequest }) => 
      CoolerService.updateCooler(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coolers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => CoolerService.deleteCooler(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coolers"] });
    },
  });

  return {
    createCooler: createMutation.mutateAsync,
    updateCooler: updateMutation.mutateAsync,
    deleteCooler: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};