import { APIClient } from "../helpers/api_helper";
import { 
  CashTransactionsResponse, 
  CashTransactionQueryParams 
} from '../types/reports2';

const api = new APIClient();

export const CashTransactionService = {
  getCashTransactions: async (
    params?: CashTransactionQueryParams
  ): Promise<CashTransactionsResponse> => {
    return await api.get(
      '/api/browses/cash-transactions',
      params 
    );
  }
};

