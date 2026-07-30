import { APIClient } from "helpers/api_helper";
import { 
    FifoValuationReportResponse,
    WarehouseSummaryResponse,
    FifoReportParams,
    WarehouseSummaryParams
} from "../types/reports";

const api = new APIClient();
const BASE_URL = "/reports/inventory";

export const InventoryReportService = {
  getFifoValuationReport: async (
    params?: FifoReportParams
  ): Promise<FifoValuationReportResponse> => {
    const query = params ? new URLSearchParams(
        params as Record<string, string>).toString() : "";
    return await api.get(
        `${BASE_URL}/fifo-valuation${query ? `?${query}` : ""}`);
  },

  getWarehouseSummaryReport: async (
    params?: WarehouseSummaryParams
  ): Promise<WarehouseSummaryResponse> => {
    const query = params ? new URLSearchParams(
        params as Record<string, string>).toString() : "";
    return await api.get(
        `${BASE_URL}/warehouse-summary${query ? `?${query}` : ""}`);
  },
};