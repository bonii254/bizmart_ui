import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { POSService } from "../../services/posService";
import { POSPayload } from "../../types/POS";
import { toast } from "react-toastify";

export const useSales = (page: number = 1, perPage: number = 100) => {
  return useQuery({
    queryKey: ["pos-sales", page, perPage],
    queryFn: () => POSService.getSales(page, perPage),
  });
};

export const useSaleDetails = (id: string | null) => {
  return useQuery({
    queryKey: ["pos-sales", id],
    queryFn: () => POSService.getSaleById(id!),
    enabled: !!id,
  });
};

export const usePOSMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: POSPayload) => POSService.createSale(data),
    onSuccess: () => {
      // Invalidate both sales history and inventory since a sale reduces stock
      queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] }); 
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