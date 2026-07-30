import { APIClient } from "../helpers/api_helper";
import { 
    Warehouse, 
    CoolerPayload, 
    UpdateCoolerRequest, 
    CoolerListResponse 
} from "../types/cooler";

const api = new APIClient();
const BASE_URL = "/warehouses";


export const CoolerService = {
  getAllCoolers: async (active?: boolean): Promise<CoolerListResponse> => {
    const params = active !== undefined ? { active: String(active) } : {};
    return await api.get(`${BASE_URL}`, { params });
  },

  createCooler: async (payload: CoolerPayload): Promise<Warehouse> => {
    const response = await api.create(`${BASE_URL}`, payload);
    return response.warehouse;
  },
  updateCooler: async (id: string, payload: UpdateCoolerRequest): Promise<Warehouse> => {
    const response = await api.update(`${BASE_URL}/${id}`, payload);
    return response.warehouse;
  },
  deleteCooler: async (id: string): Promise<{ message: string }> => {
    return await api.delete(`${BASE_URL}/${id}`);
  }
};