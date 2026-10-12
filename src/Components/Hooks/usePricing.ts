import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PriceCodeService } from "../../services/pricingService";
import { 
  PriceCode, 
  CreatePriceCodeRequest,
  ItemPrice, 
  UpsertItemPriceRequest 
} from "../../types/pricing";
import { toast } from "react-toastify";

export const usePriceCodes = () => {
  return useQuery<PriceCode[]>({
    queryKey: ["priceCodes"],
    queryFn: async () => {
      const res = await PriceCodeService.getPriceCodes();
      return res.data ?? [];
    },
  });
};

export const usePriceCodeMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (
        data: CreatePriceCodeRequest
    ) => PriceCodeService.createPriceCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceCodes"] });
      queryClient.invalidateQueries({ queryKey: ["stockItems"] });
      toast.success("Price code created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create price code");
    },
  });

  return {
    createPriceCode: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
};

export const useItemPrices = (itemId: string | null) => {
    return useQuery<ItemPrice[]>({
        queryKey: ["itemPrices", itemId],
        queryFn: async () => {
            if (!itemId) return [];
            const res = await PriceCodeService.getItemPrices(itemId);
            return res.data ?? [];
        },
        enabled: !!itemId,
    });
};

export const useItemPriceMutation = () => {
    const queryClient = useQueryClient();

    const upsertMutation = useMutation({
        mutationFn: (data: UpsertItemPriceRequest) =>
            PriceCodeService.upsertItemPrice(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["itemPrices", variables.itemId] });
            toast.success("Item price saved successfully");
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message || "Failed to save item price");
        },
    });

    return {
        upsertItemPrice: upsertMutation.mutateAsync,
        isUpserting: upsertMutation.isPending,
    };
};