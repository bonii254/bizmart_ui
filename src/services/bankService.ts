import { APIClient } from "../helpers/api_helper";
import { 
  Bank, 
  BankPayload, 
  UpdateBankRequest, 
  ApiResponse 
} from "../types/bank";

const api = new APIClient();

export const BankService = {
  getBanks: async (): Promise<ApiResponse<Bank[]>> => {
    return await api.get(`/api/banks`);
  },

  getBankById: async (id: string): Promise<ApiResponse<Bank>> => {
    return await api.get(`/api/banks/${id}`);
  },

  createBank: async (payload: BankPayload): Promise<ApiResponse<string>> => {
    return await api.create(`/api/banks`, payload);
  },

  updateBank: async (id: string, payload: UpdateBankRequest): Promise<ApiResponse<string>> => {
    return await api.create(`/api/banks/${id}/update`, payload);
  },

  deleteBank: async (id: string): Promise<ApiResponse<string>> => {
    return await api.create(`/api/banks/${id}/delete`, {});
  }
};