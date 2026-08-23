export interface Category {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  parentCategoryId: string | null;
}

export interface CategoryPayload {
  categoryCode: string;
  categoryName: string;
  parentCategoryId?: string | null; 
}

export interface UpdateCategoryRequest extends Partial<CategoryPayload> {}

export interface CategoryListResponse {
  record_count: number;
  categories: Category[];
}

export interface SingleCategoryResponse {
  message?: string;
  data: Category;
}

export interface CategoryTreeNode extends Category {
  children?: CategoryTreeNode[];
}