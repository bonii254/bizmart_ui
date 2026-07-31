export type UOM = 'LITERS' | 'KILOGRAMS';

export interface NestedWarehouse {
  name: string;
  route: string;
  warehouse_code: string;
}

export interface NestedStockItem {
  description: string;
  stock_code: string;
  uom: UOM;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  stock_item_id: string;
  qty_on_hand: string;
  total_value: string;
  unit_cost: string;
  warehouse: NestedWarehouse;
  stock_item: NestedStockItem; 
  created_at?: string; 
  updated_at?: string;
}

export interface InitializeStockPayload {
  warehouse_id: string;
  stock_item_id: string;
  qty_on_hand?: number | string;
  total_value?: number | string;
}

export interface GetBalancesParams {
  warehouse_id?: string;
}

export interface UpdateStockQtyPayload {
  qty_on_hand: number | string;
  total_value: number | string;
}

export interface DeleteStockLinkResponse {
  message: string;
}

export interface ApiErrorResponse {
  error?: string;
  [field: string]: string[] | any;
}