import { APIClient } from "../helpers/api_helper";
import { 
  StockTakeBrowseQueryParams, 
  StockTakeBrowseResponse,
  InventoryTransactionQueryParams,
  InventoryTransactionsResponse,
  SalesPerItemQueryParams,
  SalesPerItemReportResponse,
  SalesPerCustomerQueryParams,
  SalesPerCustomerReportResponse,
  PeriodicInventorySummaryQueryParams,
  PeriodicInventorySummaryResponse,
  StoreItemSummaryResponse,
} from "../types/reports";

const api = new APIClient();

export const StockTakeBrowseService = {
  getStockTakeTransactions: async (
    params?: StockTakeBrowseQueryParams
  ): Promise<StockTakeBrowseResponse> => {
    const response = await api.get(
      `/api/browses/stoktake-transactions`, params
    );
    return response.data;
  },
  
  getInventoryTransactions: async (
    params?: InventoryTransactionQueryParams
  ): Promise<InventoryTransactionsResponse> => {
    const response = await api.get(
      `/api/browses/inventory-transactions`, params
    );
    return response.data;
  },

  getSalesPerItemReport: async (
    params?: SalesPerItemQueryParams
  ): Promise<SalesPerItemReportResponse> => {
    const response = await api.get(
      `/api/reports/sales-per-item`, params
    );
    const result = response.data;

    if (Array.isArray(result)) {
      return {
        quantity: result.length,
        success: true,
        message: "Success",
        data: result,
      } as SalesPerItemReportResponse;
    }

    if (result && Array.isArray(result.data)) {
      return {
        ...result,
        quantity: result.quantity ?? result.data.length,
        success: result.success ?? true,
        message: result.message ?? "Success",
        data: result.data,
      } as SalesPerItemReportResponse;
    }

    return {
      quantity: 0,
      success: false,
      message: "No data available",
      data: [],
    } as SalesPerItemReportResponse;
  },

  getSalesPerCustomerReport: async (
    params?: SalesPerCustomerQueryParams
  ): Promise<SalesPerCustomerReportResponse> => {
    const response = await api.get(
      `/api/reports/sales-per-customer`, params
    );
    const result = response.data;

    if (Array.isArray(result)) {
      return {
        success: true,
        message: "Sales per customer report retrieved successfully.",
        data: result,
      };
    }

    if (result && Array.isArray(result.data)) {
      return {
        ...result,
        success: result.success ?? true,
        message: result.message ?? "Sales per customer report retrieved successfully.",
        data: result.data,
      };
    }

    return {
      success: false,
      message: "No data available",
      data: [],
    };
  },

  getPeriodicInventorySummary: async (
    params?: PeriodicInventorySummaryQueryParams
  ): Promise<PeriodicInventorySummaryResponse> => {
    const response = await api.get(
      `/api/reports/periodic-inventory-summary`, params
    );
    const result = response.data;

    if (Array.isArray(result)) {
      return {
        success: true,
        message: "Periodic inventory summary retrieved successfully.",
        data: result,
      };
    }

    if (result && Array.isArray(result.data)) {
      return {
        ...result,
        success: result.success ?? true,
        message: result.message ?? "Periodic inventory summary retrieved successfully.",
        data: result.data,
      };
    }

    return {
      success: false,
      message: "No data available",
      data: [],
    };
  },

  getStoreItemSummary: async (): Promise<StoreItemSummaryResponse> => {
    const response = await api.get(`/api/browses/store-item-summary`);

      const body = Array.isArray(response)
        ? { success: true, message: "", data: response }
        : response?.status !== undefined
          ? response.data
          : response;
    
      if (Array.isArray(body)) {
        return {
          success: true,
          message: "Store item summary retrieved successfully.",
          data: body,
        };
      }
      return body as StoreItemSummaryResponse;
  },
};