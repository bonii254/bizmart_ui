import { APIClient } from "../helpers/api_helper";
import { 
    BriquetteLog, 
    CreateBriquettePayload, 
    UpdateBriquettePayload, 
    QAEApprovalPayload 
} from "../types/briquette";

const api = new APIClient();
const BASE_URL = "/v1/briquettes";

export const BriquetteService = {
  createLog: async (payload: CreateBriquettePayload): Promise<BriquetteLog> => {
    const response = await api.create(`${BASE_URL}`, payload);
    return response.briquettelog;
  },

  getTodaysLog: async (): Promise<BriquetteLog> => {
    const response = await api.get(`${BASE_URL}/today`);
    return response.briquettelog;
  },

  updateLog: async (logId: string, payload: UpdateBriquettePayload): Promise<BriquetteLog> => {
    return await api.update(`${BASE_URL}/${logId}`, payload);
  },

  deleteLog: async (logId: string): Promise<{ message: string }> => {
    const response = await api.delete(`${BASE_URL}/${logId}`);
    return response.message;
  },

  reviewLogs: async (params: Record<string, any>) => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`${BASE_URL}/review?${query}`); 
    return { count: response.count, logs: response.logs };
  },


  approveLog: async (logId: string, payload: QAEApprovalPayload): Promise<{ message: string; log: BriquetteLog }> => {
    const response = await api.create(`${BASE_URL}/${logId}/approval`, payload);
    return response.log;  
  }
};