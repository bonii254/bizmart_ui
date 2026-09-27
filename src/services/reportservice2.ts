import { APIClient } from "../helpers/api_helper";
import { 
  CashTransactionsResponse, 
  CashTransactionQueryParams,
  CustomerStatementReportResponse, 
  CustomerStatementQueryParams,
  SupplierStatementQueryParams, 
  SupplierStatementResponse
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

export const CustomerStatementService = {
  getCustomerStatement: async (
    params: CustomerStatementQueryParams
  ): Promise<CustomerStatementReportResponse> => {
    const { customerId, ...queryParams } = params;

    if (!customerId) {
      throw new Error("Customer ID is required to fetch customer statement.");
    }

    return await api.get(
      `/api/reports/customers/${customerId}/statement`,
      queryParams
    );
  }
};

export const SupplierStatementService = {
  getSupplierStatement: async (
    params: SupplierStatementQueryParams
  ): Promise<SupplierStatementResponse> => {
    const { supplierId, ...queryParams } = params;

    if (!supplierId) {
      throw new Error("Supplier ID is required to fetch Supplier statement.");
    }
  
    return await api.get(
      `/api/reports/suppliers/${supplierId}/statement`,
      queryParams
    );
  }
};
