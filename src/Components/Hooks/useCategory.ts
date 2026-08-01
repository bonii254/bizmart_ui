import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryService } from "../../services/categoryService"; 
import { CategoryPayload, UpdateCategoryRequest } from "../../types/category";

export const useCategories = (search?: string, activeOnly?: boolean, parentId?: string) => {
  return useQuery({
    queryKey: ["categories", search, activeOnly, parentId],
    queryFn: () => CategoryService.listCategories(search, activeOnly, parentId),
  });
};

export const useCategoryDetails = (id: string) => {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => CategoryService.getCategoryDetails(id),
    enabled: !!id, 
  });
};

export const useCategoryMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CategoryPayload) => 
      CategoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) => 
      CategoryService.updateCategory(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", variables.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      CategoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return {
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};