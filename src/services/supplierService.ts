import { APIClient } from "../helpers/api_helper";
import { 
  Supplier, 
  SupplierPayload, 
  UpdateSupplierRequest, 
  SupplierListResponse 
} from "../types/supplier";

const api = new APIClient();

export const SupplierService = {
  getSuppliers: async (page = 1, perPage = 100): Promise<SupplierListResponse> => {
    return await api.get(`/suppliers`, { params: { page, per_page: perPage } });
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    return await api.get(`/suppliers/${id}`);
  },

  createSupplier: async (payload: SupplierPayload): Promise<Supplier> => {
    const response = await api.create(`/suppliers`, payload);
    return response.supplier ?? response;
  },

  updateSupplier: async (id: string, payload: UpdateSupplierRequest): Promise<Supplier> => {
    const response = await api.update(`/suppliers/${id}`, payload);
    return response.supplier ?? response;
  },

  deleteSupplier: async (id: string): Promise<{ message: string }> => {
    return await api.delete(`/suppliers/${id}`);
  }
};