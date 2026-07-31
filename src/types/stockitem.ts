export type UOM = 'LITERS' | 'KILOGRAMS';

export interface StockItem {
  id: string;
  stock_code: string;
  description: string;
  uom: UOM;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockItemPayload {
  stock_code: string;
  description: string;
  uom: UOM;
  is_active?: boolean;
}

export interface UpdateStockItemRequest extends Partial<StockItemPayload> {}

export interface DistributionBalance {
  warehouse_id: string;
  warehouse_name: string;
  quantity_on_hand: number;
  valuation: number;
}

export interface StockCatalogResponse {
  record_count: number;
  catalog: StockItem[];
}

export interface SingleStockItemResponse {
  message?: string;
  data: StockItem;
}

export interface StockItemBalancesResponse {
  stock_item_id: string;
  distribution_balances: DistributionBalance[];
}