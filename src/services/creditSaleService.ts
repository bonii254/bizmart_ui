import { APIClient } from "../helpers/api_helper";
import { 
  CreateCreditSaleRequest, 
  CreditSaleResponse, 
  CreditSaleResultData
} from "../types/creditSale";

const api = new APIClient();

const CREDIT_SALES_BASE_URL = "/api/transactions/credit-sales";

export const CreditSalesService = {
  createCreditSale: async (
    payload: CreateCreditSaleRequest
  ): Promise<CreditSaleResultData> => {
    const response: CreditSaleResponse = await api.create(
      CREDIT_SALES_BASE_URL, 
      payload
    );
    return response.data;
  },
};