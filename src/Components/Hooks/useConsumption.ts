import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

import { ConsumptionService } from "../../services/consumptionService";
import type {
  MachineConsumptionPayload,
  ConsumptionSuccessResponse,
  ValidationErrorResponse,
  OperationalErrorResponse,
} from "../../types/consumption";

type ConsumptionErrorResponse = ValidationErrorResponse & OperationalErrorResponse;

export const useConsumption = () => {
  const queryClient = useQueryClient();

  const logConsumptionMutation = useMutation<
    ConsumptionSuccessResponse,
    AxiosError<ConsumptionErrorResponse>,
    MachineConsumptionPayload
  >({
    mutationFn: async (payload: MachineConsumptionPayload) => {
      return ConsumptionService.logConsumption(payload);
    },

    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["coolerStock"],
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
          "Asset usage logged and transaction finalized successfully."
      );
    },

    onError: (error) => {
      const apiError = error.response?.data;

      switch (apiError?.error) {
        case "Schema validation failed":
          toast.error("Form validation failed. Please review the entered values.");
          break;

        case "Inventory transaction validation failed":
          toast.error(apiError.message ?? apiError.error);
          break;

        case "Access Denied":
          toast.error(
            apiError.message ?? 
              "Authorization block: Operator is not assigned to an active cooler."
          );
          break;

        default:
          toast.error(
            apiError?.message ??
              apiError?.error ??
              error.message ??
              "An unexpected error occurred while logging resource consumption."
          );
      }
    },
  });

  return {
    logConsumption: logConsumptionMutation.mutateAsync,

    isProcessing: logConsumptionMutation.isPending,
    data: logConsumptionMutation.data,
    error: logConsumptionMutation.error,
    isSuccess: logConsumptionMutation.isSuccess,
    isError: logConsumptionMutation.isError,
    reset: logConsumptionMutation.reset,
  };
};