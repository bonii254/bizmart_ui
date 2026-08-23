import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GoodsReceiptService } from "../../services/grnService";
import { 
  CreateGoodsReceiptPayload, 
  GoodsReceiptCreatedData, 
  GoodsReceiptDetailData 
} from "../../types/grn";
import { toast } from "react-toastify";

export const useGoodsReceiptDetails = (id: string | null) => {
  return useQuery<GoodsReceiptDetailData>({
    queryKey: ["goods-receipts", id],
    queryFn: () => GoodsReceiptService.getGoodsReceiptById(id!),
    enabled: !!id,
  });
};

export const useGoodsReceiptMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateGoodsReceiptPayload): Promise<GoodsReceiptCreatedData> => 
      GoodsReceiptService.createGoodsReceipt(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-balances"] });
      toast.success(`Goods Receipt ${data.documentNumber} posted successfully.`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to post Goods Receipt");
    },
  });

  return {
    createGoodsReceipt: createMutation.mutateAsync,
    isPosting: createMutation.isPending,
  };
};