import { APIClient } from "../helpers/api_helper";
import { 
  CashTransactionsResponse, 
  CashTransactionQueryParams,
  CustomerStatementReportResponse, 
  CustomerStatementQueryParams,
  SupplierStatementQueryParams, 
  SupplierStatementResponse,
  InventoryValuationQueryParams,
  InventoryValuationResponse,
  OperatorSalesSummaryQueryParams,
  OperatorSalesSummaryResponse,
  SalesPaymentSummaryQueryParams,
  SalesPaymentSummaryResponse,
  DailyTillSummaryQueryParams,
  DailyTillSummaryResponse,
  MonthlyInventoryStatementQueryParams,
  MonthlyInventoryStatementResponse,
  CustomerBalanceData, 
  CustomerBalanceResponse,
  GoodsReceiptQueryParams,
  GoodsReceiptListResponse,
  CustomerInvoicesResponse,
  SupplierInvoicesResponse,
  StockTakeBrowseQueryParams,
  StockTakeBrowseResponse, 
  StockTakeTransactionDetailQueryParams,
  StockTakeTransactionDetailResponse
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

export const getInventoryValuation = async (
  params?: InventoryValuationQueryParams
): Promise<InventoryValuationResponse> => {
  return await api.get(
    '/api/reports/inventory-valuation',
    params
  );
};

export const OperatorSalesSummaryService = {
  getOperatorSalesSummary: async (
    params?: OperatorSalesSummaryQueryParams
  ): Promise<OperatorSalesSummaryResponse> => {
    return await api.get(
      '/api/reports/operator-sales-summary',
      params
    );
  }
};

export const SalesPaymentSummaryService = {
  getSalesPaymentSummary: async (
    params?: SalesPaymentSummaryQueryParams
  ): Promise<SalesPaymentSummaryResponse> => {
    return await api.get(
      '/api/reports/sales-payment-summary',
      params
    );
  }
};

export const DailyTillSummaryService = {
  getDailyTillSummary: async (
    params?: DailyTillSummaryQueryParams
  ): Promise<DailyTillSummaryResponse> => {
    return await api.get(
      '/api/reports/daily-till-summary',
      params
    );
  }
};

export const getMonthlyInventoryStatement = async (
  params?: MonthlyInventoryStatementQueryParams
): Promise<MonthlyInventoryStatementResponse> => {
  return await api.get(
    '/api/reports/inventory-statement-monthly',
    params 
  );
};

export const CustomerBalanceService = {
  getCustomerBalance: async (
    customerId: string
  ): Promise<CustomerBalanceData> => {
    const response: CustomerBalanceResponse = await api.get(
      `/api/accounts/customers/${customerId}/balance`
    );
    return response.data ?? response;
  },
};

export const GoodsReceiptService = {
  getGoodsReceipts: async (
    params?: GoodsReceiptQueryParams
  ): Promise<GoodsReceiptListResponse> => {
    return await api.get(
      '/api/browses/goods-receipts',
      params
    );
  }
};

export const CustomerInvoicesService = {
  getCustomerInvoices: async (
    customerId: string
  ): Promise<CustomerInvoicesResponse> => {
    const response: CustomerInvoicesResponse = await api.get(
      `/api/accounts/customers/${customerId}/invoices`
    );
    return response;
  }
};

export const SupplierInvoicesService = {
  getSupplierInvoices: async (
    supplierId: string
  ): Promise<SupplierInvoicesResponse> => {
    const response: SupplierInvoicesResponse = await api.get(
      `/api/accounts/suppliers/${supplierId}/invoices`
    );
    return response;
  }
};

export const StockTakeBrowseService = {
  getStockTakeBrowse: async (
    params?: StockTakeBrowseQueryParams
  ): Promise<StockTakeBrowseResponse> => {
    return await api.get(
      '/api/browses/stoktake-transactions',
      params
    );
  }
};

export const StockTakeTransactionDetailService = {
  getStockTakeTransactionsDetail: async (
    params?: StockTakeTransactionDetailQueryParams
  ): Promise<StockTakeTransactionDetailResponse> => {
    return await api.get("/api/browses/stock-take-transactions-detail", { params });
  },
};