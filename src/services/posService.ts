import { APIClient } from "../helpers/api_helper";
import { 
  CreateSalesReceiptPayload, 
  SalesReceiptDocument,
  GetSalesReceiptResponse,
  CreateSalesReceiptResponse,
  ApiResponse,
  SalesTransaction,
  SalesTransactionQueryParams,
  CreateSalesReturnRequest, 
  SalesReturnResultData, 
  SalesReturnResponse
} from "../types/POS"; 

const api = new APIClient();

const DOCUMENTS_BASE_URL = "/api/documents/sales-receipts";
const TRANSACTIONS_BASE_URL = "/api/transactions/sales-receipts";
const BROWSE_TRANSACTIONS_BASE_URL = "/api/browses/sales-transactions";
const SALES_RETURNS_BASE_URL = "/api/transactions/sales-returns";

export const POSService = {
  getSales: async (): Promise<ApiResponse<SalesReceiptDocument[]>> => {
    return await api.get(DOCUMENTS_BASE_URL);
  },

  getSaleById: async (id: string): Promise<SalesReceiptDocument> => {
    const response: GetSalesReceiptResponse = await api.get(
      `${DOCUMENTS_BASE_URL}/${id}`
    );
    return response.data;
  },

  createSale: async (
    payload: CreateSalesReceiptPayload
  ): Promise<SalesReceiptDocument> => {
    const response: CreateSalesReceiptResponse = await api.create(
      TRANSACTIONS_BASE_URL, payload
    );
    return response.data;
  },

  getSalesTransactions: async (
    params?: SalesTransactionQueryParams
  ): Promise<ApiResponse<SalesTransaction[]>> => {
    return await api.get(BROWSE_TRANSACTIONS_BASE_URL, params);
  }
};

export const SalesReturnService = {
  createSalesReturn: async (
    payload: CreateSalesReturnRequest
  ): Promise<SalesReturnResultData> => {
    const response: SalesReturnResponse = await api.create(
      SALES_RETURNS_BASE_URL, 
      payload
    );
    return response.data ?? response;
  },
};