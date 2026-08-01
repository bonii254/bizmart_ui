import { APIClient } from "../helpers/api_helper";
import { 
  CashWithdrawalHeader, 
  CashWithdrawalPayload, 
  CashWithdrawalListResponse, 
  SingleCashWithdrawalResponse 
} from "../types/cashWithdrawal";

const api = new APIClient();

export const CashWithdrawalService = {
  getWithdrawals: async (params?: Record<string, any>): Promise<CashWithdrawalListResponse> => {
    return await api.get(`/finance/cash-withdrawals`, { params });
  },

  getWithdrawalById: async (id: string): Promise<CashWithdrawalHeader> => {
    const response: SingleCashWithdrawalResponse = await api.get(`/finance/cash-withdrawals/${id}`);
    return response.cash_withdrawal_201 ?? response;
  },

  createWithdrawal: async (payload: CashWithdrawalPayload): Promise<CashWithdrawalHeader> => {
    const response: SingleCashWithdrawalResponse = await api.create(`/finance/cash-withdrawals`, payload);
    return response.cash_withdrawal_201 ?? response;
  }
};