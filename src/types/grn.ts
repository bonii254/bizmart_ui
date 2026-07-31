export interface SupplierReceiptLine {
  stock_item_id: string;

  qty_received: string;

  unit_cost: string;
}

export interface SupplierReceiptPayload {
  supplier_invoice_or_grn: string;

  receipt_lines: SupplierReceiptLine[];
}

export interface LedgerEntry {
  transaction_id: string | null;
  stock_item_id: string;
  quantity: string;
  unit_cost: string;
  total_value: string;
}

export interface GRNSuccessResponse {
  message: string;
  data: {
    warehouse_id: string;
    reference_doc: string;
    items_processed: number;
    ledger_entries: LedgerEntry[];
  };
}

export interface SchemaValidationErrorResponse {
  error: "Schema validation failed";
  details: Record<string, unknown>;
}

export interface InventoryErrorResponse {
  error: "GRN processing validation failed";
  message: string;
}

export interface UnexpectedErrorResponse {
  error: string;
}


export type GRNErrorResponse =
  | SchemaValidationErrorResponse
  | InventoryErrorResponse
  | UnexpectedErrorResponse;

export type GRNApiResponse = GRNSuccessResponse | GRNErrorResponse;