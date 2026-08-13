import { APIClient } from "../helpers/api_helper";
import { 
  StockItem, 
  StockItemPayload, 
  UpdateStockItemRequest,
  StockCatalogResponse,
} from "../types/stockitem";

const api = new APIClient();
const BASE_URL = "/mock/inventory/items";

export const StockItemService = {
  listMasterCatalog: async (search?: string, activeOnly?: boolean): Promise<StockCatalogResponse> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (activeOnly !== undefined) params.active_only = String(activeOnly);

    return await api.get(`${BASE_URL}`, { params });
  },

  
  createMasterStockItem: async (payload: StockItemPayload): Promise<StockItem> => {
    const response = await api.create(`${BASE_URL}`, payload);
    return response.data;
  },

  getMasterItemDetails: async (id: string): Promise<StockItem> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  updateMasterStockItem: async (id: string, payload: UpdateStockItemRequest): Promise<StockItem> => {
    const response = await api.update(`${BASE_URL}/${id}`, payload);
    return response.data;
  },
  deleteMasterStockItem: async (id: string): Promise<{ message: string }> => {
    const response: { message: string } = await api.delete(`${BASE_URL}/${id}`);
    return response;
  },
  
};