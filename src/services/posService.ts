import { APIClient } from "../helpers/api_helper";
import { 
  POSHeader, 
  POSPayload, 
  POSListResponse, 
  SinglePOSResponse 
} from "../types/POS";

const api = new APIClient();
const BASE_URL = "/mock/pos";

export const POSService = {
  getSales: async (page = 1, perPage = 100): Promise<POSListResponse> => {
    return await api.get(`${BASE_URL}/sales`, { params: { page, per_page: perPage } });
  },

  getSaleById: async (id: string): Promise<POSHeader> => {
    const response: SinglePOSResponse = await api.get(`${BASE_URL}/sales/${id}`);
    return response.sale_receipt_201 ?? response;
  },

  createSale: async (payload: POSPayload): Promise<POSHeader> => {
    const response: SinglePOSResponse = await api.create(`${BASE_URL}/sales`, payload);
    return response.sale_receipt_201 ?? response;
  }
};