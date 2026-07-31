export interface MachineConsumptionPayload {
  stock_item_id: string;
  qty_consumed: string;
  is_metered_asset: boolean;
  runtime_start?: string | null;
  runtime_stop?: string | null;
  notes?: string | null;
}

export interface ConsumptionResponseData {
  id: string;
  cooler_id: string;
  stock_item_id: string;
  qty_consumed: string;
  runtime_start: string | null;
  runtime_stop: string | null;
  transaction_id: string;
}

export interface ConsumptionSuccessResponse {
  message: string;
  data: ConsumptionResponseData;
}

export interface OperationalErrorResponse {
  error: string;
  message: string;
}

export interface ValidationErrorResponse {
  error: string;
  details: Record<string, string[]>;
}