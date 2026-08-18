import { APIClient } from "../helpers/api_helper";
import { 
  Supplier, 
  SupplierPayload, 
  UpdateSupplierRequest, 
  GetSuppliersResponse,
  GetSupplierByIdResponse,
  CreateSupplierResponse,
  UpdateSupplierResponse,
  DeleteSupplierResponse
} from "../types/supplier";

const api = new APIClient();

const BASE_URL = "/api/suppliers"; 

export const SupplierService = {
  getSuppliers: async (page = 1, perPage = 100): Promise<Supplier[]> => {
    const response: GetSuppliersResponse = await api.get(BASE_URL);
    return response.data || [];
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    const response: GetSupplierByIdResponse = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  createSupplier: async (payload: SupplierPayload): Promise<string> => {
    const response: CreateSupplierResponse = await api.create(BASE_URL, payload);
    return response.data;
  },

  updateSupplier: async (id: string, payload: UpdateSupplierRequest): Promise<string> => {
    const response: UpdateSupplierResponse = await api.create(`${BASE_URL}/${id}/update`, payload);
    return response.data;
  },

  deleteSupplier: async (id: string): Promise<string> => {
    const response: DeleteSupplierResponse = await api.create(`${BASE_URL}/${id}/delete`, "");
    return response.data;
  }
};