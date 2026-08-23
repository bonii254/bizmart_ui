export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface StockTakeLineRequest {
  itemId: string;
  countedQuantity: number;
  unitCost: number;
}

export interface CreateStockTakeRequest {
  warehouseId: string;
  operatorId: string;
  lines: StockTakeLineRequest[];
}

export interface StockTakeSummary {
  documentId: string;
  documentNumber: string;
  total: number;
  postedAt: string;
}

export type CreateStockTakeResponse = ApiResponse<StockTakeSummary>;

export interface StockTakeVarianceParams {
  stockTakeId: string;
}

export interface StockTakeVarianceItem {
  itemId?: string;
  itemCode?: string;
  itemDescription?: string;
  systemQuantity?: number;
  countedQuantity?: number;
  varianceQuantity?: number;
  unitCost?: number;
  varianceValue?: number;
  [key: string]: any; 
}

export type StockTakeVarianceResponse = ApiResponse<StockTakeVarianceItem[]>;