import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requisitionService } from "../../services/requisationService";
import {
  CreateRequisitionPayload,
  UpdateRequisitionPayload,
  RouteRequisitionPayload,
  IssueRequisitionPayload,
  ReceiveRequisitionPayload,
  ApiValidationError,
  ApiInventoryBusinessError
} from "../../types/requisition";

export const requisitionKeys = {
  all: ["requisitions"] as const,
  lists: () => [...requisitionKeys.all, "list"] as const,
  list: (page: number, perPage: number) => [...requisitionKeys.lists(), { page, perPage }] as const,
  details: () => [...requisitionKeys.all, "detail"] as const,
  detail: (id: string) => [...requisitionKeys.details(), id] as const,
};

export const useRequisitionsLedger = (page: number, perPage: number) => {
  return useQuery({
    queryKey: requisitionKeys.list(page, perPage),
    queryFn: () => requisitionService.getAllRequisitions(page, perPage),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30, 
  });
};

export const useRequisitionDetail = (reqId: string, enabled = true) => {
  return useQuery({
    queryKey: requisitionKeys.detail(reqId),
    queryFn: () => requisitionService.getRequisitionById(reqId),
    enabled: !!reqId && enabled, 
  });
};

export const useCreateRequisition = () => {
  const queryClient = useQueryClient();

  return useMutation<any, ApiValidationError | string, CreateRequisitionPayload>({
    mutationFn: (payload) => requisitionService.createRequisition(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisitionKeys.lists() });
    },
  });
};

export const useUpdateDraftRequisition = (reqId: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, ApiValidationError | string, UpdateRequisitionPayload>({
    mutationFn: (payload) => requisitionService.updateDraftRequisition(reqId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisitionKeys.detail(reqId) });
      queryClient.invalidateQueries({ queryKey: requisitionKeys.lists() });
    },
  });
};

export const useRouteRequisition = () => {
  const queryClient = useQueryClient();

  return useMutation<any, ApiValidationError | string, RouteRequisitionPayload>({
    mutationFn: (payload) => requisitionService.routeRequisition(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: requisitionKeys.detail(variables.req_id) });
      queryClient.invalidateQueries({ queryKey: requisitionKeys.lists() });
    },
  });
};

export const useApproveRequisition = (reqId: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, string, void>({
    mutationFn: () => requisitionService.approveRequisition(reqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisitionKeys.detail(reqId) });
      queryClient.invalidateQueries({ queryKey: requisitionKeys.lists() });
    },
  });
};

export const useCancelRequisition = (reqId: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, string, void>({
    mutationFn: () => requisitionService.cancelRequisition(reqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisitionKeys.detail(reqId) });
      queryClient.invalidateQueries({ queryKey: requisitionKeys.lists() });
    },
  });
};

export const useIssueStock = (reqId: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, ApiValidationError | ApiInventoryBusinessError | string, IssueRequisitionPayload>({
    mutationFn: (payload) => requisitionService.issueStock(reqId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisitionKeys.detail(reqId) });
      queryClient.invalidateQueries({ queryKey: requisitionKeys.lists() });
    },
  });
};

export const useReceiveStock = (reqId: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, ApiValidationError | ApiInventoryBusinessError | string, ReceiveRequisitionPayload>({
    mutationFn: (payload) => requisitionService.receiveStock(reqId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisitionKeys.detail(reqId) });
      queryClient.invalidateQueries({ queryKey: requisitionKeys.lists() });
    },
  });
};