import { APIClient } from "../helpers/api_helper";

import {
  SupplierReceiptPayload,
  GRNSuccessResponse,
} from "../types/grn";

const api = new APIClient();

const BASE_URL = "/warehouses";

export const GRNService = {
  processSupplierReceipt: async (
    warehouseId: string,
    payload: SupplierReceiptPayload
  ): Promise<GRNSuccessResponse> => {
    return await api.create(
      `${BASE_URL}/${warehouseId}/receipts`,
      payload
    );
  },
};