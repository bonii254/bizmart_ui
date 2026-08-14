import { APIClient } from "../helpers/api_helper";
import { 
  Supplier, 
  SupplierPayload, 
  UpdateSupplierRequest, 
  SupplierListResponse 
} from "../types/supplier";

const api = new APIClient();

// Ensure BASE_URL starts with a single slash and has no trailing slashes
const BASE_URL = "/mock/suppliers"; 

export const SupplierService = {
  getSuppliers: async (page = 1, perPage = 100): Promise<SupplierListResponse> => {
    return await api.get(BASE_URL, { page, per_page: perPage });
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    return await api.get(`${BASE_URL}/${id}`);
  },

  createSupplier: async (payload: SupplierPayload): Promise<Supplier> => {
    const response = await api.create(BASE_URL, payload);
    return response.supplier ?? response;
  },

  updateSupplier: async (id: string, payload: UpdateSupplierRequest): Promise<Supplier> => {
    const response = await api.update(`${BASE_URL}/${id}`, payload);
    return response.supplier ?? response;
  },

  deleteSupplier: async (id: string): Promise<{ message: string }> => {
    return await api.delete(`${BASE_URL}/${id}`);
  }
};