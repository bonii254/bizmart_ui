import { APIClient } from "../helpers/api_helper";
import { 
  StockTakeBrowseQueryParams, 
  StockTakeBrowseResponse,
  InventoryTransactionQueryParams,
  InventoryTransactionsResponse,
  SalesPerItemQueryParams,
  SalesPerItemReportResponse
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
  }
};