import { APIClient } from "../helpers/api_helper";
import { 
  Warehouse, 
  WarehousePayload, 
  UpdateWarehouseRequest, 
  ApiResponse 
} from "../types/warehouse";

const api = new APIClient();
const BASE_URL = "/api/warehouses";

export const WarehouseService = {
  getAllWarehouses: async (): Promise<Warehouse[]> => {
    const response: ApiResponse<Warehouse[]> = await api.get(BASE_URL);
    return response.data || [];
  },

  getWarehouseById: async (warehouseId: string): Promise<Warehouse> => {
    const response: ApiResponse<Warehouse> = await api.get(`${BASE_URL}/${warehouseId}`);
    return response.data;
  },

  createWarehouse: async (payload: WarehousePayload): Promise<string> => {
    const response: ApiResponse<string> = await api.create(BASE_URL, payload);
    return response.data;
  },

  updateWarehouse: async (
    warehouseId: string,
    payload: UpdateWarehouseRequest
  ): Promise<string> => {
    const response: ApiResponse<string> = await api.create(
      `${BASE_URL}/${warehouseId}/update`,
      payload
    );
    return response.data;
  },

  deleteWarehouse: async (warehouseId: string): Promise<string> => {
    const response: ApiResponse<string> = await api.create(
      `${BASE_URL}/${warehouseId}/delete`,
      {}
    );
    return response.data;
  },
};