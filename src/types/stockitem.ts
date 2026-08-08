import { Category } from "./category";

export type UOM =
  | "LITERS"
  | "KILOGRAMS"
  | "GALLONS"
  | "GRAMS"
  | "TONS"
  | "POUNDS"
  | "PIECES"
  | "EACH"
  | "UNITS"
  | "PACKS"
  | "BOXES"
  | "CARTONS"
  | "CASES"
  | "CRATES"
  | "PALLETS"
  | "BAGS"
  | "BUNDLES"
  | "DOZENS"
  | "SETS"
  | "PAIRS"
  | "METERS"
  | "CENTIMETERS"
  | "FEET"
  | "INCHES"
  | "ROLLS"
  | "SQUARE_METERS"
  | "SQUARE_FEET"
  | "CUBIC_METERS";

export interface StockItemCategorySummary {
  id: string;
  name: string;
}

export interface StockItem {
  id: string;
  stock_code: string;
  description: string;
  uom: UOM;
  alternate_uom?: UOM | null;
  alternate_uom_conversion_factor?: number | null;
  category_id?: string | null;
  category_name?: string | null;
  category?: Category | StockItemCategorySummary | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockItemPayload {
  stock_code: string;
  description: string;
  uom: UOM;
  category_id?: string | null;
  is_active?: boolean;
  alternate_uom?: UOM | null;
  alternate_uom_conversion_factor?: number | null;
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