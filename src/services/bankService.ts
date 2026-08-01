import { APIClient } from "../helpers/api_helper";
import { 
  Bank, 
  BankPayload, 
  UpdateBankRequest, 
  BankListResponse 
} from "../types/bank";

const api = new APIClient();

export const BankService = {
  getBanks: async (page = 1, perPage = 100): Promise<BankListResponse> => {
    return await api.get(`/banks`, { params: { page, per_page: perPage } });
  },

  getBankById: async (id: string): Promise<Bank> => {
    return await api.get(`/banks/${id}`);
  },

  createBank: async (payload: BankPayload): Promise<Bank> => {
    const response = await api.create(`/banks`, payload);
    return response.bank ?? response;
  },

  updateBank: async (id: string, payload: UpdateBankRequest): Promise<Bank> => {
    const response = await api.update(`/banks/${id}`, payload);
    return response.bank ?? response;
  },

  deleteBank: async (id: string): Promise<{ message: string }> => {
    return await api.delete(`/banks/${id}`);
  }
};