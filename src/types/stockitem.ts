import { Category } from "./category";

export const UOM_VALUES = [
  "LITERS", "KILOGRAMS", "GALLONS", "GRAMS", "TONS", "POUNDS", 
  "PIECES", "EACH", "UNITS", "PACKS", "BOXES", "CARTONS", 
  "CASES", "CRATES", "PALLETS", "BAGS", "BUNDLES", "DOZENS", 
  "SETS", "PAIRS", "METERS", "CENTIMETERS", "FEET", "INCHES", 
  "ROLLS", "SQUARE_METERS", "SQUARE_FEET", "CUBIC_METERS"
] as const;

export type UOM = typeof UOM_VALUES[number];

export interface StockItemCategorySummary {
  id: string;
  name: string;
}

export interface StockItem {
  id: string;
  itemCode: string;
  description: string;
  uom: UOM;
  categoryId?: string | null;
  categoryName?: string | null;
  category?: Category | StockItemCategorySummary | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockItemPayload {
  itemCode: string;
  description: string;
  uom: UOM;
  categoryId?: string | null;
  is_active?: boolean;
}

export interface UpdateStockItemRequest extends Partial<StockItemPayload> {}

export interface StockCatalogResponse {
  record_count: number;
  catalog: StockItem[];
}