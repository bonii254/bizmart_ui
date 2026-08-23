import { useQuery } from "@tanstack/react-query";
import { StockTakeBrowseService } from "../../services/reportsService";
import { 
  StockTakeBrowseQueryParams, 
  StockTakeTransaction,
  InventoryTransactionQueryParams,
  InventoryTransaction
} from "../../types/reports";

export const useStockTakeTransactions = (params?: StockTakeBrowseQueryParams) => {
  return useQuery<StockTakeTransaction[]>({
    queryKey: ["stocktake-transactions", params],
    queryFn: async () => {
      const res = await StockTakeBrowseService.getStockTakeTransactions(params);
      return res.data ?? [];
    },
  });
};

export const useInventoryTransactions = (params?: InventoryTransactionQueryParams) => {
  return useQuery<InventoryTransaction[]>({
    queryKey: ["inventory-transactions", params],
    queryFn: async () => {
      const res = await StockTakeBrowseService.getInventoryTransactions(params);
      return res.data ?? [];
    },
  });
};