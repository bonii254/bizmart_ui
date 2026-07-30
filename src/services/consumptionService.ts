import { APIClient } from "../helpers/api_helper";
import {
  MachineConsumptionPayload,
  ConsumptionSuccessResponse,
} from "../types/consumption";

const api = new APIClient();

const BASE_URL = "/coolers";

export const ConsumptionService = {
  logConsumption: async (
    payload: MachineConsumptionPayload
  ): Promise<ConsumptionSuccessResponse> => {
    return await api.create(
      `${BASE_URL}/consumption`, 
      payload
    );
  },
};