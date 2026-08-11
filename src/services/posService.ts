import { APIClient } from "../helpers/api_helper";
import { 
  POSHeader, 
  POSPayload, 
  POSListResponse, 
  SinglePOSResponse 
} from "../types/POS";

const api = new APIClient();

export const POSService = {
  getSales: async (page = 1, perPage = 100): Promise<POSListResponse> => {
    return await api.get(`/sales/transactions`, { params: { page, per_page: perPage } });
  },

  getSaleById: async (id: string): Promise<POSHeader> => {
    const response: SinglePOSResponse = await api.get(`/sales/transactions/${id}`);
    return response.sale_receipt_201 ?? response;
  },

  createSale: async (payload: POSPayload): Promise<POSHeader> => {
    const response: SinglePOSResponse = await api.create(`/sales/transactions`, payload);
    return response.sale_receipt_201 ?? response;
  }
};