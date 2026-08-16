import { APIClient } from "../helpers/api_helper";
import {
  StockTakeHeaderDetail,
  CreateStockTakePayload,
  UpdateStockTakePayload,
  PostStockTakePayload,
  StockTakeMutationResponse,
  PostStockTakeTransactionResponse,
  GetPaginatedStockTakesResponse,
  GetSingleStockTakeResponse,
} from "../types/stocktake"; 

const api = new APIClient();
const BASE_URL = "/mock/stock-takes";

export const StockTakeService = {
  createStockTake: async (
    payload: CreateStockTakePayload
  ): Promise<StockTakeMutationResponse> => {
    return await api.create(`${BASE_URL}`, payload);
  },

  getPaginatedStockTakes: async (
    warehouseId?: string
  ): Promise<GetPaginatedStockTakesResponse> => {
    let url = `${BASE_URL}`;
    if (warehouseId) {
      url += `&warehouse_id=${warehouseId}`;
    }
    return await api.get(url);
  },

  getStockTake: async (
    stockTakeId: string
  ): Promise<GetSingleStockTakeResponse> => {
    return await api.get(`${BASE_URL}/${stockTakeId}`);
  },

  updateStockTake: async (
    stockTakeId: string,
    payload: UpdateStockTakePayload
  ): Promise<StockTakeMutationResponse> => {
    return await api.update(`${BASE_URL}/${stockTakeId}`, payload);
  },

  postStockTake: async (
    stockTakeId: string,
    payload?: PostStockTakePayload
  ): Promise<PostStockTakeTransactionResponse> => {
    return await api.create(`${BASE_URL}/${stockTakeId}/post`, payload ?? {});
  },

  cancelStockTake: async (
    stockTakeId: string
  ): Promise<StockTakeMutationResponse> => {
    return await api.delete(`${BASE_URL}/${stockTakeId}`);
  },
};