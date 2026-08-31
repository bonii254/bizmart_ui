import { useQuery } from "@tanstack/react-query";
import { StockTakeBrowseService } from "../../services/reportsService";
import { 
  StockTakeBrowseQueryParams, 
  StockTakeTransaction,
  InventoryTransactionQueryParams,
  InventoryTransaction,
  SalesPerItemQueryParams,
  SalesPerItemReportResponse,
  SalesPerCustomerQueryParams,
  SalesPerCustomerItem
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

export const useSalesPerItemReport = (params?: SalesPerItemQueryParams) => {
  return useQuery<SalesPerItemReportResponse[]>({
    queryKey: ["sales-per-item-report", params],
    queryFn: async () => {
      const rawList = await StockTakeBrowseService.getSalesPerItemReport(params);

      return rawList.data.map((item: any) => ({
        ...item,
        soldAt: item.soldAt || item.sold_at,
        invoiceNumber: item.invoiceNumber || item.invoice_number,
        customerName: item.customerName || item.customer_name,
        customerCode: item.customerCode || item.customer_code,
        itemCode: item.itemCode || item.item_code,
        stockUom: item.stockUom || item.stock_uom,
        unitPrice: Number(item.unitPrice ?? item.unit_price ?? item.sellingPrice ?? 0),
        quantity: Number(item.quantity ?? 0),
        lineTotal: Number(item.lineTotal ?? item.line_total ?? 0),
      }));
    },
  });
};

export const useSalesPerCustomerReport = (params?: SalesPerCustomerQueryParams) => {
  return useQuery<SalesPerCustomerItem[]>({
    queryKey: ["sales-per-customer-report", params],
    queryFn: async () => {
      const rawList = await StockTakeBrowseService.getSalesPerCustomerReport(params);

      return (rawList.data ?? []).map((item: any) => ({
        ...item,
        soldAt: item.soldAt || item.sold_at,
        invoiceNumber: item.invoiceNumber || item.invoice_number,
        customerCode: item.customerCode || item.customer_code,
        customerName: item.customerName || item.customer_name,
        itemCode: item.itemCode || item.item_code,
        description: item.description || "",
        stockUom: item.stockUom || item.stock_uom,
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
        lineTotal: Number(item.lineTotal ?? item.line_total ?? 0),
      }));
    },
  });
};