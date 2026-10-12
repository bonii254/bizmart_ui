import { APIClient } from "../helpers/api_helper";
import { 
  ReasonCode,
  CreateReasonCodeRequest,
  GetReasonCodesResponse,
  CreateReasonCodeResponse,
  GetReasonCodeByIdResponse
} from "../types/reasonCode";

const api = new APIClient();

const REASON_CODES_BASE_URL = "/api/utilities/reason-codes";

export const ReasonCodeService = {
  getReasonCodes: async (): Promise<ReasonCode[]> => {
    const response: GetReasonCodesResponse = await api.get(
      REASON_CODES_BASE_URL
    );
    return response.data ?? [];
  },

  getReasonCodeById: async (id: string): Promise<ReasonCode> => {
    const response: GetReasonCodeByIdResponse = await api.get(
      `${REASON_CODES_BASE_URL}/${id}`
    );
    return response.data;
  },

  createReasonCode: async (
    payload: CreateReasonCodeRequest
  ): Promise<string> => {
    const response: CreateReasonCodeResponse = await api.create(
      REASON_CODES_BASE_URL, 
      payload
    );
    return response.data;
  },
};