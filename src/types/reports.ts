export interface StockTakeBrowseQueryParams {
  fromDate?: string;
  toDate?: string; 
  WarehouseId?: string;
  operatorId?: string;
}

export interface StockTakeTransaction {
  id?: string;
  stockTakeId?: string;
  stockTakeNo?: string;
  warehouseId?: string;
  warehouseName?: string;
  operatorId?: string;
  operatorName?: string;
  itemCode?: string;
  itemName?: string;
  systemQuantity?: number;
  countedQuantity?: number;
  varianceQuantity?: number;
  unitCost?: number;
  varianceValue?: number;
  transactionDate?: string;
  remarks?: string;
  [key: string]: unknown;
}

export interface StockTakeBrowseResponse {
  success: boolean;
  message: string;
  data: StockTakeTransaction[];
}


export interface InventoryTransactionQueryParams {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  itemId?: string;
}

export type InventoryTransactionType = 
  | "sale" 
  | "goods_receipt" 
  | "stock_take" 
  | (string & {});

export interface InventoryTransaction {
  transaction_id: string;
  posted_at: string;
  transaction_type: InventoryTransactionType;
  reference_number: string;
  warehouse_code: string;
  item_code: string;
  description: string;
  stock_uom: string;
  quantity: number;
  unit_cost: number;
}

export interface InventoryTransactionsResponse {
  success: boolean;
  message: string;
  data: InventoryTransaction[];
}