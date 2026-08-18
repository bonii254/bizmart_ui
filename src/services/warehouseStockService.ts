import { APIClient } from "../helpers/api_helper";
import {
  ApiResponse,
  ItemWarehouseStock,
  AssignWarehouseToItemRequest,
} from "../types/warehouseStock";

const api = new APIClient();
const ITEMS_BASE_URL = "/api/inventory/items";
const WAREHOUSES_BASE_URL = "/api/inventory/warehouses";

export const ItemWarehouseService = {
  getItemWarehouses: async (itemId: string): Promise<ItemWarehouseStock[]> => {
    const response: ApiResponse<ItemWarehouseStock[]> = await api.get(
      `${ITEMS_BASE_URL}/${itemId}/warehouses`
    );
    return response.data || [];
  },

  getWarehouseItems: async (warehouseId: string): Promise<ItemWarehouseStock[]> => {
    const response: ApiResponse<ItemWarehouseStock[]> = await api.get(
      `${WAREHOUSES_BASE_URL}/${warehouseId}/items`
    );
    return response.data || [];
  },

  assignWarehouseToItem: async (
    itemId: string,
    payload: AssignWarehouseToItemRequest
  ): Promise<string> => {
    const response: ApiResponse<string> = await api.create(
      `${ITEMS_BASE_URL}/${itemId}/warehouses`,
      payload
    );
    return response.data;
  },

  removeItemWarehouse: async (
    itemId: string,
    warehouseId: string
  ): Promise<string> => {
    const response: ApiResponse<string> = await api.create(
      `${ITEMS_BASE_URL}/${itemId}/warehouses/${warehouseId}/delete`,
      ""
    );
    return response.data;
  },
};