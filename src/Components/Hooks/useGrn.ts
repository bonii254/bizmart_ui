import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

import { GRNService } from "../../services/grnService";
import type {
  SupplierReceiptPayload,
  GRNSuccessResponse,
  GRNErrorResponse,
} from "../../types/grn";

export const useGRN = (warehouseId?: string) => {
  const queryClient = useQueryClient();

  const processReceiptMutation = useMutation<
    GRNSuccessResponse,
    AxiosError<GRNErrorResponse>,
    SupplierReceiptPayload
  >({
    mutationFn: async (payload: SupplierReceiptPayload) => {
      if (!warehouseId) {
        throw new Error("Warehouse ID is required to process a Goods Received Note.");
      }

      return GRNService.processSupplierReceipt(warehouseId, payload);
    },

    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["warehouseStock"],
      });
      queryClient.invalidateQueries({
        queryKey: ["stockBalances"],
      });
      queryClient.invalidateQueries({
        queryKey: ["stockItems"],
      });
      queryClient.invalidateQueries({
        queryKey: ["inventoryTransactions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["inventorySummary"],
      });
      toast.success(
        response.message ??
          "Goods Received Note processed successfully and FIFO layers committed."
      );
    },

    onError: (error) => {
      const apiError = error.response?.data;

      switch (apiError?.error) {
        case "Schema validation failed":
          toast.error("Form validation failed. Please review the entered values.");
          break;

        case "GRN processing validation failed":
          toast.error(apiError.error);
          break;

        default:
          toast.error(
            apiError?.error ??
              error.message ??
              "An unexpected error occurred while processing the Goods Received Note."
          );
      }
    },
  });

  return {
    submitReceipt: processReceiptMutation.mutateAsync,

    isProcessing: processReceiptMutation.isPending,
    data: processReceiptMutation.data,
    error: processReceiptMutation.error,
    isSuccess: processReceiptMutation.isSuccess,
    isError: processReceiptMutation.isError,
    reset: processReceiptMutation.reset,
  };
};