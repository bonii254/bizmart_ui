import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GRNService } from "../../services/grnService";
import { GRNPayload } from "../../types/grn";
import { toast } from "react-toastify";

export const useGRNs = (page: number = 1, perPage: number = 100) => {
  return useQuery({
    queryKey: ["goods-receipts", page, perPage],
    queryFn: () => GRNService.getGRNs(page, perPage),
  });
};

export const useGRNDetails = (id: string | null) => {
  return useQuery({
    queryKey: ["goods-receipts", id],
    queryFn: () => GRNService.getGRNById(id!),
    enabled: !!id,
  });
};

export const useGRNMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: GRNPayload) => GRNService.createGRN(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      toast.success("Goods Receipt posted successfully (FIFO Lot Updated)");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to post Goods Receipt");
    },
  });

  return {
    createGRN: createMutation.mutateAsync,
    isPosting: createMutation.isPending,
  };
};