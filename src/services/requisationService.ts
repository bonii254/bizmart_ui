import { APIClient } from "../helpers/api_helper";
import {
  CreateRequisitionPayload,
  RequisitionMutationResponse,
  RouteRequisitionPayload,
  RequisitionWorkflowActionResponse,
  GetPaginatedRequisitionsResponse,
  GetSingleRequisitionResponse,
  UpdateRequisitionPayload,
  RequisitionApprovalResponse,
  IssueRequisitionPayload,
  IssueStockTransactionResponse,
  ReceiveRequisitionPayload,
  ReceiveStockTransactionResponse
} from "../types/requisition";

class RequisitionService {
  private client: APIClient;
  private basePath = "/requisitions";

  constructor() {
    this.client = new APIClient();
  }

  public createRequisition = (
    payload: CreateRequisitionPayload
  ): Promise<RequisitionMutationResponse> => {
    return this.client.create(this.basePath, payload);
  };

  public routeRequisition = (
    payload: RouteRequisitionPayload
  ): Promise<RequisitionWorkflowActionResponse> => {
    return this.client.create(`${this.basePath}/route`, payload);
  };

  public getAllRequisitions = (
    page = 1,
    perPage = 10
  ): Promise<GetPaginatedRequisitionsResponse> => {
    return this.client.get(`${this.basePath}/all`, {
      page,
      per_page: perPage,
    });
  };

  public getRequisitionById = (
    reqId: string
  ): Promise<GetSingleRequisitionResponse> => {
    return this.client.get(`${this.basePath}/${reqId}`);
  };

  public updateDraftRequisition = (
    reqId: string,
    payload: UpdateRequisitionPayload
  ): Promise<RequisitionMutationResponse> => {
    return this.client.put(`${this.basePath}/${reqId}`, payload);
  };

  public approveRequisition = (
    reqId: string
  ): Promise<RequisitionApprovalResponse> => {
    return this.client.create(`${this.basePath}/${reqId}/approve`, {});
  };

  public cancelRequisition = (
    reqId: string
  ): Promise<RequisitionWorkflowActionResponse> => {
    return this.client.create(`${this.basePath}/${reqId}/cancel`, {});
  };

  public issueStock = (
    reqId: string,
    payload: IssueRequisitionPayload
  ): Promise<IssueStockTransactionResponse> => {
    return this.client.create(`${this.basePath}/${reqId}/issue`, payload);
  };

  public receiveStock = (
    reqId: string,
    payload: ReceiveRequisitionPayload
  ): Promise<ReceiveStockTransactionResponse> => {
    return this.client.create(`${this.basePath}/${reqId}/receive`, payload);
  };
}

export const requisitionService = new RequisitionService();