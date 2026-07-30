export enum warehouseType {
  MAIN_STORE = "MAIN_STORE",
  IN_TRANSIT = "IN_TRANSIT",
  COOLER = "COOLER"
}

export interface FifoLayerItem {
  warehouse_code: string;
  warehouse_name: string;
  stock_code: string;
  description: string;
  layer_id: string;
  original_qty: string;
  remaining_qty: string;
  unit_cost: string;
  layer_total_value: string;
  receipt_date: string;
}

export interface FifoValuationReportResponse {
  description: string;
  generated_at: string;
  dataset: FifoLayerItem[];
}

export interface FifoReportParams {
  warehouse_id?: string;
}

export interface WarehouseSummaryItem {
  warehouse_code: string;
  warehouse_name: string;
  warehouse_type: warehouseType;
  distinct_skus: number;
  total_physical_units: string;
  total_value_balance: string;
}

export interface WarehouseSummaryResponse {
  description: string;
  generated_at: string;
  dataset: WarehouseSummaryItem[];
}

export interface WarehouseSummaryParams {
  warehouse_id?: string;
}