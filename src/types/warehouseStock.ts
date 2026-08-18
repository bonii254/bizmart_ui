export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ItemWarehouseStock {
  itemId: string;
  itemCode: string;
  itemDescription?: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  quantityOnHand: number;
  averageCost: number;
  inventoryValue: number;
}

export interface AssignWarehouseToItemRequest {
  warehouseId: string;
  quantityOnHand?: number;
  averageCost?: number;
  [key: string]: any;
}

// Response Types
export type GetItemWarehousesResponse = ApiResponse<ItemWarehouseStock[]>;
export type GetWarehouseItemsResponse = ApiResponse<ItemWarehouseStock[]>;
export type AssignWarehouseToItemResponse = ApiResponse<string>;
export type DeleteItemWarehouseResponse = ApiResponse<string>;

// Path Parameter Interfaces
export interface ItemWarehousePathParams {
  itemId?: string;
  warehouseId?: string;
}

export interface GetWarehouseItemsParams {
  warehouseId: string;
}