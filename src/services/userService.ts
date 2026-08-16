import { APIClient } from "../helpers/api_helper";
import { 
  OperatorPayload, 
  UpdateOperatorPayload, 
  OperatorListResponse,
  SingleOperatorResponse,
  OperatorMutationResponse,
  CreateOperatorPasswordPayload,
  CreateOperatorPasswordResponse
} from "../types/user";

const api = new APIClient();
const BASE_URL = "/api/operators";

export const OperatorService = {
  getAllOperators: async (): Promise<OperatorListResponse> => {
    return await api.get(BASE_URL);
  },

  createOperator: async (payload: OperatorPayload): Promise<OperatorMutationResponse> => {
    return await api.create(BASE_URL, payload);
  },

  getOperatorById: async (id: string): Promise<SingleOperatorResponse> => {
    return await api.get(`${BASE_URL}/${id}`);
  },

  getOperatorByCode: async (operatorCode: string): Promise<SingleOperatorResponse> => {
    return await api.get(`${BASE_URL}/${operatorCode}`);
  },

  // POST /api/operators/{id}/update
  updateOperator: async (id: string, payload: UpdateOperatorPayload): Promise<OperatorMutationResponse> => {
    return await api.create(`${BASE_URL}/${id}/update`, payload);
  },

  // POST /api/operators/{id}/delete
  deleteOperator: async (id: string): Promise<OperatorMutationResponse> => {
    return await api.create(`${BASE_URL}/${id}/delete`, {});
  },

  // POST /api/security/operators/{operatorId}/password
  createOperatorPassword: async (
    operatorId: string, 
    payload: CreateOperatorPasswordPayload
  ): Promise<CreateOperatorPasswordResponse> => {
    return await api.create(`/api/security/operators/${operatorId}/password`, payload);
  },
};