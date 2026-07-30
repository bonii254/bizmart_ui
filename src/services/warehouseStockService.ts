import { APIClient } from "../helpers/api_helper";
import { 
  WarehouseStock, 
  InitializeStockPayload, 
  UpdateStockQtyPayload, 
  DeleteStockLinkResponse 
} from "../types/warehouseStock";

const api = new APIClient();
const BASE_URL = "/stock-balances";

export const WarehouseStockService = {
  initializeStock: async (payload: InitializeStockPayload): Promise<WarehouseStock> => {
    return await api.create(`${BASE_URL}`, payload);
  },

  getAllBalances: async (warehouseId?: string): Promise<WarehouseStock[]> => {
    const url = warehouseId ? `${BASE_URL}?warehouse_id=${warehouseId}` : BASE_URL;
    return await api.get(url);
  },

  getBalance: async (stockId: string): Promise<WarehouseStock> => {
    return await api.get(`${BASE_URL}/${stockId}`);
  },

  adjustStock: async (stockId: string, payload: UpdateStockQtyPayload): Promise<WarehouseStock> => {
    return await api.update(`${BASE_URL}/${stockId}`, payload);
  },
  removeStockLink: async (stockId: string): Promise<DeleteStockLinkResponse> => {
    return await api.delete(`${BASE_URL}/${stockId}`);
  }
};