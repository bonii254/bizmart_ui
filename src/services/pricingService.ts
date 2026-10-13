import { APIClient } from "../helpers/api_helper";
import { 
  PriceCode, 
  CreatePriceCodeRequest, 
  ItemPrice,
  UpsertItemPriceRequest,
  ApiResponse 
} from "../types/pricing";

const api = new APIClient();

export const PriceCodeService = {
  getPriceCodes: async (): Promise<ApiResponse<PriceCode[]>> => {
    return await api.get(`/api/pricing/price-codes`);
  },

  createPriceCode: async (
    payload: CreatePriceCodeRequest
): Promise<ApiResponse<string>> => {
    return await api.create(`/api/pricing/price-codes`, payload);
  },

  getItemPrices: async (priceCode: string): Promise<ApiResponse<ItemPrice[]>> => {
        return await api.get(`/api/pricing/items/${priceCode}/prices`);
    },

  upsertItemPrice: async (
        payload: UpsertItemPriceRequest
    ): Promise<ApiResponse<string>> => {
        return await api.create(`/api/pricing/item-prices`, payload);
    }
};