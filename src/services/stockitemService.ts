import { APIClient } from "../helpers/api_helper";
import {
  StockItem,
  StockItemPayload,
  UpdateStockItemRequest,
  StockItemQueryParams,
  ApiResponse,
} from "../types/stockitem";

const api = new APIClient();
const BASE_URL = "/api/inventory/items";

export const StockItemService = {
  listMasterCatalog: async (params?: StockItemQueryParams): Promise<StockItem[]> => {
    const response: ApiResponse<StockItem[]> = await api.get(BASE_URL, { params });
    return response.data || [];
  },

  getMasterItemDetails: async (itemId: string): Promise<StockItem> => {
    const response: ApiResponse<StockItem> = await api.get(`${BASE_URL}/${itemId}`);
    return response.data;
  },

  getMasterItemByCode: async (itemCode: string): Promise<StockItem> => {
    const response: ApiResponse<StockItem> = await api.get(
      `/api/inventory/itemscode/${encodeURIComponent(itemCode)}`
    );
    return response.data;
  },

  createMasterStockItem: async (payload: StockItemPayload): Promise<string> => {
    const response: ApiResponse<string> = await api.create(BASE_URL, payload);
    return response.data;
  },

  updateMasterStockItem: async (
    itemId: string,
    payload: UpdateStockItemRequest
  ): Promise<StockItem> => {
    const response: ApiResponse<StockItem> = await api.update(
      `${BASE_URL}/${itemId}`,
      payload
    );
    return response.data;
  },

  deleteMasterStockItem: async (itemId: string): Promise<{ message: string }> => {
    return await api.delete(`${BASE_URL}/${itemId}`);
  },
};