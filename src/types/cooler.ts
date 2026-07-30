export enum warehouseType {
  MAIN_STORE = "MAIN_STORE",
  IN_TRANSIT = "IN_TRANSIT",
  COOLER = "COOLER"
}


export interface Warehouse {
  id: string;
  name: string;
  is_active: boolean;
  type: warehouseType;
  warehouse_code: string;
  fuel_capacity_liters: number;
  route: string;
  expected_consumption_rate: number;
  created_at: string;
  updated_at: string;
  
  fuel_logs_count?: number;
  briquette_logs_count?: number;
}

export interface CoolerPayload {
  name: string;
  route: string;
  fuel_capacity_liters: number;
  expected_consumption_rate: number;
  is_active?: boolean;
  type?: warehouseType;
  warehouse_code?: string;
}

export interface UpdateCoolerRequest extends Partial<CoolerPayload> {}

export interface CoolerListResponse {
  warehouses: Warehouse[];
  total_count: number;
  total_pages: number;
  current_page: number;
  per_page: number;
}