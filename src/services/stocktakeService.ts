import { APIClient } from "../helpers/api_helper";
import {
  CreateStockTakeRequest,
  CreateStockTakeResponse,
  StockTakeVarianceResponse,
} from "../types/stocktake";

const api = new APIClient();

const TRANSACTIONS_URL = "/api/transactions/stock-takes";
const REPORTS_URL = "/api/reports/stock-takes";

export const StockTakeService = {
  createStockTake: async (
    payload: CreateStockTakeRequest
  ): Promise<CreateStockTakeResponse> => {
    return await api.create(TRANSACTIONS_URL, payload);
  },
  getStockTakeVariance: async (
    stockTakeId: string
  ): Promise<StockTakeVarianceResponse> => {
    return await api.get(`${REPORTS_URL}/${stockTakeId}/variance`);
  },
};