export interface Category {
  id: string;
  category_code: string;
  category_name: string;
  description?: string;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryPayload {
  category_code: string;
  category_name: string;
  description?: string;
  parent_id?: string | null; 
  is_active?: boolean;
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