import { APIClient } from "../helpers/api_helper";
import { 
  Warehouse, 
  WarehousePayload, 
  UpdateWarehouseRequest, 
  WarehouseListResponse 
} from "../types/warehouse";

const api = new APIClient();
const BASE_URL = "/mock/warehouses";

export const WarehouseService = {
  getAllWarehouses: async (active?: boolean): Promise<WarehouseListResponse> => {
    const params = active !== undefined ? { active: String(active) } : {};
    return await api.get(`${BASE_URL}`, { params });
  },


  createWarehouse: async (payload: WarehousePayload): Promise<Warehouse> => {
      const response = await api.create(`${BASE_URL}`, payload);
      return response.warehouse;
    },
  
  updateWarehouse: async (
      id: string,
      payload: UpdateWarehouseRequest
    ): Promise<Warehouse> => {
      const response = await api.update(`${BASE_URL}/${id}`, payload);
      return response.warehouse;
    },
  
  deleteWarehouse: async (id: string): Promise<{ message: string }> => {
      return await api.delete(`${BASE_URL}/${id}`);
    },
};