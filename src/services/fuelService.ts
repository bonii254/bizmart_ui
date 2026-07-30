import { APIClient } from "../helpers/api_helper";
import { 
    FuelDailyLog, 
    CreateFuelLogPayload, 
    UpdateFuelLogPayload, 
    QAEFuelApprovalPayload 
} from "../types/fuel";

const api = new APIClient();
const BASE_URL = "/v1/fuel";

export const FuelService = {
  createLog: async (payload: CreateFuelLogPayload): Promise<FuelDailyLog> => {
    return await api.create(`${BASE_URL}`, payload);
  },

  getTodaysLog: async (): Promise<FuelDailyLog> => {
      const response = await api.get(`${BASE_URL}/today`);
      return response.log;
    },

  getRejectedLogs: async (): Promise<FuelDailyLog[]> => {
    const response = await api.get(`${BASE_URL}/rejected`);
    return response.log;
  },

  updateLog: async (logId: string, payload: UpdateFuelLogPayload): Promise<FuelDailyLog> => {
    return await api.update(`${BASE_URL}/${logId}`, payload);
  },

  deleteLog: async (logId: string): Promise<{ message: string }> => {
    return await api.delete(`${BASE_URL}/delete/${logId}`);
  },

  reviewLogs: async (params: Record<string, any>) => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`${BASE_URL}/review?${query}`); 
    return { 
        logs: response.logs as FuelDailyLog[], 
        pagination: response.pagination 
    };
  },

  approveLog: async (
    logId: string, 
    payload: QAEFuelApprovalPayload
  ): Promise<{ message: string; log: FuelDailyLog }> => {
    return await api.create(`${BASE_URL}/${logId}/approval`, payload);
  }
};