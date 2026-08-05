export interface Warehouse {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface WarehousePayload {
  warehouseCode: string;
  warehouseName: string;
  isActive?: boolean;
}

export interface UpdateWarehouseRequest extends Partial<WarehousePayload> {}

export interface WarehouseListResponse {
  warehouses: Warehouse[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}