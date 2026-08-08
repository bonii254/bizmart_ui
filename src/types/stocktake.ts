export type StockTakeStatus =
  | "Draft"
  | "In Progress"
  | "Completed"
  | "Posted"
  | "Cancelled";

export interface StockTakeLineItem {
  stock_take_detail_id: string;
  stock_take_id: string;
  item_id: string;
  expected_quantity: string;
  counted_quantity: string;
  stock_code?: string;
  description?: string;
  uom?: string;
  variance?: string;
}

export interface StockTakeHeaderDetail {
  stock_take_id: string;
  stock_take_number: string;
  warehouse_id: string;
  operator_id: string;
  posted_at: string;
  status?: StockTakeStatus;
  lines: StockTakeLineItem[];
  warehouse_name?: string;
  warehouse_route?: string;
  operator_name?: string;
}

export interface CreateStockTakeLinePayload {
  item_id: string;
  counted_quantity: string;
  expected_quantity?: string;
}

export interface CreateStockTakePayload {
  warehouse_id: string;
  lines: CreateStockTakeLinePayload[];
}

export interface UpdateStockTakeLinePayload {
  stock_take_detail_id?: string | null;
  item_id: string;
  counted_quantity: string;
  expected_quantity?: string;
}

export interface UpdateStockTakePayload {
  warehouse_id: string;
  lines: UpdateStockTakeLinePayload[];
}

export interface PostStockTakePayload {
  stock_take_id: string;
  notes?: string | null;
}

export interface StockTakeMutationResponse {
  message: string;
  data: {
    stock_take_id: string;
    stock_take_number: string;
    status: StockTakeStatus;
    line_count: number;
  };
}

export interface PostStockTakeTransactionResponse {
  message: string;
  data: {
    stock_take_id: string;
    stock_take_number: string;
    posted_at: string;
    status: StockTakeStatus;
    lines: {
      stock_take_detail_id: string;
      item_id: string;
      expected_quantity: string;
      counted_quantity: string;
      variance: string;
    }[];
  };
}

export interface GetPaginatedStockTakesResponse {
  status: "success";
  message: string;
  data: {
    items: StockTakeHeaderDetail[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
  };
}

export interface GetSingleStockTakeResponse {
  data: StockTakeHeaderDetail;
}


export interface ApiStockTakeValidationError {
  error: "Validation failed" | "Schema validation failed";
  details: Record<string, string[]>;
}

export interface ApiStockTakeBusinessError {
  error: "Inventory business rule violation";
  message: string;
}

export interface ApiStockTakeNotFoundErrorResponse {
  error: "Stock take not found";
}

export interface ApiStockTakeSystemPanicErrorResponse {
  status?: "error";
  message?: string;
  error?:
    | "An unexpected internal error occurred."
    | "An unexpected error occurred during the stock take posting transaction.";
}