import { APIClient } from "../helpers/api_helper";
import { 
  GRNHeader, 
  GRNPayload, 
  GRNListResponse, 
  SingleGRNResponse 
} from "../types/grn";

const api = new APIClient();

export const GRNService = {
  getGRNs: async (page = 1, perPage = 100): Promise<GRNListResponse> => {
    return await api.get(`/inventory/goods-receipts`, { params: { page, per_page: perPage } });
  },

  getGRNById: async (id: string): Promise<GRNHeader> => {
    const response: SingleGRNResponse = await api.get(`/inventory/goods-receipts/${id}`);
    return response.goods_receipt_201 ?? response;
  },

  createGRN: async (payload: GRNPayload): Promise<GRNHeader> => {
    const response: SingleGRNResponse = await api.create(`/inventory/goods-receipts`, payload);
    return response.goods_receipt_201 ?? response;
  }
};