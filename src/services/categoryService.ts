import { APIClient } from "../helpers/api_helper";
import { 
  Category, 
  CategoryPayload, 
  UpdateCategoryRequest, 
  CategoryListResponse,
  SingleCategoryResponse
} from "../types/category";

const api = new APIClient();
const BASE_URL = "/api/inventory/categories"; 

export const CategoryService = {
  listCategories: async (search?: string, activeOnly?: boolean, parentId?: string): Promise<CategoryListResponse> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (activeOnly !== undefined) params.active_only = String(activeOnly);
    if (parentId !== undefined) params.parent_id = parentId; 

    const response =  await api.get(BASE_URL);
    return response.data
  },
  
  createCategory: async (payload: CategoryPayload): Promise<Category> => {
    const response: SingleCategoryResponse = await api.create(`${BASE_URL}`, payload);
    return response.data;
  },

  getCategoryDetails: async (id: string): Promise<Category> => {
    const response: SingleCategoryResponse = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  updateCategory: async (id: string, payload: UpdateCategoryRequest): Promise<Category> => {
    const response: SingleCategoryResponse = await api.update(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<{ message: string }> => {
    const response: { message: string } = await api.delete(`${BASE_URL}/${id}`);
    return response;
  }
};