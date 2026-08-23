import { APIClient } from "../helpers/api_helper";
import { 
  CreateGoodsReceiptPayload, 
  CreateGoodsReceiptResponse, 
  GoodsReceiptCreatedData,
  GoodsReceiptDetailData,
  SingleGoodsReceiptResponse
} from "../types/grn";

const api = new APIClient();

export const GoodsReceiptService = {
  createGoodsReceipt: async (
    payload: CreateGoodsReceiptPayload
  ): Promise<GoodsReceiptCreatedData> => {
    const response: CreateGoodsReceiptResponse = await api.create(
      "/api/transactions/goods-receipts", 
      payload
    );
    return response.data;
  },

  getGoodsReceiptById: async (
    id: string
  ): Promise<GoodsReceiptDetailData> => {
    const response: SingleGoodsReceiptResponse = await api.get(
      `/api/documents/goods-receipts/${id}`
    );
    return response.data;
  }
};