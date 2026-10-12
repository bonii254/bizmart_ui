import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReasonCodeService } from "../../services/reasonCodeService";
import { ReasonCode, CreateReasonCodeRequest } from "../../types/reasonCode";
import { toast } from "react-toastify";

export const useReasonCodes = () => {
  return useQuery<ReasonCode[]>({
    queryKey: ["reasonCodes"],
    queryFn: async () => {
      return await ReasonCodeService.getReasonCodes();
    },
  });
};

export const useReasonCodeMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateReasonCodeRequest) =>
      ReasonCodeService.createReasonCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reasonCodes"] });
      toast.success("Reason code created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create reason code"
      );
    },
  });

  return {
    createReasonCode: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
};