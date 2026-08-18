export interface Category {
  id: string;
  name: string;
}

export interface StockItemCategorySummary {
  id: string;
  name: string;
}

export interface StockItem {
  itemId: string;
  itemCode: string;
  description: string;
  categoryId?: string | null;
  productClassDescription?: string | null;
  sellingPrice: number;
  stockUom: string;
  alternateUom?: string | null;
  alternateConversionFactor?: number | null;
  isActive: boolean;
  id?: string;
  categoryName?: string | null;
  category?: Category | StockItemCategorySummary | null;
  created_at?: string;
  updated_at?: string;
}

export interface StockItemPayload {
  itemCode: string;
  description: string;
  categoryId?: string | null;
  sellingPrice: number;
  stockUom: string;
  alternateUom?: string | null;
  alternateConversionFactor?: number | null;
  isActive?: boolean;
}

export interface UpdateStockItemRequest extends Partial<StockItemPayload> {
  itemId?: string;
}

export interface StockItemQueryParams {
  itemCode?: string;
  itemId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type StockCatalogResponse = ApiResponse<StockItem[]>;
export type StockItemSingleResponse = ApiResponse<StockItem>;
export type CreateStockItemResponse = ApiResponse<string>; // Returns newly created itemId