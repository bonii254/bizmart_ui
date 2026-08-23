import { APIClient } from "../helpers/api_helper";
import { 
  StockTakeBrowseQueryParams, 
  StockTakeBrowseResponse,
  InventoryTransactionQueryParams,
  InventoryTransactionsResponse
} from "../types/reports";

const api = new APIClient();

export const StockTakeBrowseService = {
  getStockTakeTransactions: async (
    params?: StockTakeBrowseQueryParams
  ): Promise<StockTakeBrowseResponse> => {
    const response = await api.get(
      `/api/browses/stoktake-transactions`, params
    );
    return response.data
  },
  
  getInventoryTransactions: async (
      params?: InventoryTransactionQueryParams
    ): Promise<InventoryTransactionsResponse> => {
      const response = await api.get(
        `/api/browses/inventory-transactions`, params
      );
      return response.data;
    }
};