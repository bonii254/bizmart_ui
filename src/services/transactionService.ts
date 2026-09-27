import { APIClient } from "../helpers/api_helper";
import { 
  CreateCashMovementRequest, 
  CashMovementResponse, 
  CashMovementResultData 
} from "../types/transactions";

const api = new APIClient();

export const CashMovementService = {
  createCashMovement: async (
    payload: CreateCashMovementRequest
  ): Promise<CashMovementResultData> => {
    const response: CashMovementResponse = await api.create(
      "/api/transactions/cash-movements", 
      payload
    );
    return response.data;
  }
};