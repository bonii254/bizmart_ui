export type ReqStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Partially Issued"
  | "IN_TRANSIT"
  | "Issued"
  | "Received"
  | "Rejected"
  | "COMPLETED"
  | "PARTIALLY_RECEIVED";

export interface RequisitionLineItem {
  id: string;
  requisition_id: string;
  stock_item_id: string;
  stock_code: string;
  description: string;
  qty_requested: string;
  qty_issued: string;
  qty_received: string;
  created_at: string;
  uom: string;
  qty_in_transit: string;
}

export interface RequisitionHeaderDetail {
  id: string;
  req_number: string;
  source_warehouse_id: string;
  dest_warehouse_id: string;
  status: ReqStatus;
  requester_id: string;
  current_holder_id: string;
  approver_id: string | null;
  action_notes: string | null;
  created_at: string;
  updated_at: string;
  lines: RequisitionLineItem[];
  requestor_name?: string;
  approver_name?: string | null;
  holder_name?: string | null;
  source_warehouse_name?: string;
  source_warehouse_route?: string;
  dest_warehouse_name?: string;
  dest_warehouse_route?: string;
}

export interface CreateRequisitionPayload {
  dest_warehouse_id: string;
  lines: {
    stock_item_id: string;
    qty_requested: string;
  }[];
}

export interface UpdateRequisitionPayload {
  dest_warehouse_id: string;
  lines: {
    id?: string | null;
    stock_item_id: string;
    qty_requested: string;
  }[];
}

export interface RouteRequisitionPayload {
  req_id: string;
  routed_to_user_id: string;
  action_notes?: string | null;
}

export interface IssueRequisitionPayload {
  issue_data: {
    line_id: string;
    qty_to_issue: string;
  }[];
}

export interface ReceiveRequisitionPayload {
  receipt_data: {
    line_id: string;
    qty_to_receive: string;
  }[];
}

export interface RequisitionMutationResponse {
  message: string;
  data: {
    id: string;
    req_number: string;
    status: ReqStatus;
    line_count: number;
  };
}

export interface RequisitionWorkflowActionResponse {
  message: string;
  data: {
    id: string;
    req_number: string;
    status: ReqStatus;
  };
}

export interface RequisitionApprovalResponse {
  message: string;
  data: {
    id: string;
    req_number: string;
    status: ReqStatus;
    approver_id: string;
  };
}

export interface GetPaginatedRequisitionsResponse {
  status: "success";
  message: string;
  data: {
    items: RequisitionHeaderDetail[]; 
    total: number;
    page: number;
    per_page: number;
    pages: number;
  };
}

export interface GetSingleRequisitionResponse {
  data: RequisitionHeaderDetail;
}

export interface IssueStockTransactionResponse {
  message: string;
  data: {
    id: string;
    req_number: string;
    status: ReqStatus;
    lines: {
      line_id: string;
      stock_item_id: string;
      qty_requested: string;
      qty_issued: string;
    }[];
  };
}

export interface ReceiveStockTransactionResponse {
  message: string;
  data: {
    id: string;
    req_number: string;
    status: ReqStatus;
    lines: {
      line_id: string;
      stock_item_id: string;
      qty_issued: string;
      qty_received: string;
    }[];
  };
}

export interface ApiValidationError {
  error: "Validation failed" | "Schema validation failed";
  details: Record<string, string[]>;
}

export interface ApiInventoryBusinessError {
  error: "Inventory business rule violation";
  message: string;
}

export interface ApiValueErrorResponse {
  error: string;
}

export interface ApiNotFoundErrorResponse {
  error: "Requisition not found";
}

export interface ApiSystemPanicErrorResponse {
  status?: "error"; 
  message?: string;
  error?: "An unexpected internal error occurred." | "An unexpected error occurred during the warehouse transaction." | "An unexpected error occurred during the warehouse receipt transaction.";
}