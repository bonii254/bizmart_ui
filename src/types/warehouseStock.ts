import { UOM } from "./stockitem";

export interface NestedWarehouse {
  id: string;
  warehouseCode: string;
  warehouseName: string;
}

export interface NestedStockItem {
  id: string;
  itemCode: string;
  description: string;
  uom: UOM; 
}

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  stockItemId: string;
  
  qtyOnHand: number;
  unitCost: number;
  totalValue: number;
  sellingPrice?: number | null;
  
  uom: UOM;
  alternateUom?: UOM | null;
  alternateUomConversionFactor?: number | null;
  
  warehouse: NestedWarehouse;
  stockItem: NestedStockItem;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface InitializeStockPayload {
  warehouseId: string;
  stockItemId: string;
  qtyOnHand?: number | string;
  unitCost?: number | string;
  sellingPrice?: number | string | null;
  totalValue?: number | string;
  alternateUom?: UOM | null;
  alternateUomConversionFactor?: number | string | null;
}

export interface UpdateStockQtyPayload {
  qtyOnHand?: number | string;
  unitCost?: number | string;
  totalValue?: number | string;
  sellingPrice?: number | string | null;
  alternateUom?: UOM | null;
  alternateUomConversionFactor?: number | string | null;
}

export interface GetBalancesParams {
  warehouseId?: string;
  stockItemId?: string;
  search?: string;
}

export interface DeleteStockLinkResponse {
  message: string;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  [field: string]: any;
}