export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


export interface Warehouse {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  isActive: boolean;
}

export interface WarehousePayload {
  warehouseCode: string;
  warehouseName: string;
  isActive?: boolean;
}

export interface UpdateWarehouseRequest extends Partial<WarehousePayload> {}

export type WarehouseListResponse = ApiResponse<Warehouse[]>;
export type WarehouseSingleResponse = ApiResponse<Warehouse>;
export type WarehouseMutationResponse = ApiResponse<string>;