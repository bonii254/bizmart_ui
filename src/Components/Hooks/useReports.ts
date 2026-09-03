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
  SalesPerCustomerItem,
  PeriodicInventorySummaryQueryParams,
  PeriodicInventorySummaryItem,
  StoreItemSummaryResponse,
  StoreItemSummary
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

export const usePeriodicInventorySummary = (params?: PeriodicInventorySummaryQueryParams) => {
  return useQuery<PeriodicInventorySummaryItem[]>({
    queryKey: ["periodic-inventory-summary", params],
    queryFn: async () => {
      const res = await StockTakeBrowseService.getPeriodicInventorySummary(params);

      return (res.data ?? []).map((item: any) => ({
        ...item,
        periodMonth: item.periodMonth || item.period_month,
        warehouseCode: item.warehouseCode || item.warehouse_code,
        itemCode: item.itemCode || item.item_code,
        stockUom: item.stockUom || item.stock_uom,
        openingBalance: Number(item.openingBalance ?? item.opening_balance ?? 0),
        receipts: Number(item.receipts ?? 0),
        sales: Number(item.sales ?? 0),
        expenses: Number(item.expenses ?? 0),
        adjustments: Number(item.adjustments ?? 0),
        closingBalance: Number(item.closingBalance ?? item.closing_balance ?? 0),
      }));
    },
  });
};

export const useStoreItemSummary = () => {
  return useQuery<StoreItemSummary[]>({
    queryKey: ["store-item-summary"],
    queryFn: async () => {
      const res = await StockTakeBrowseService.getStoreItemSummary();

      return (res.data ?? []).map((item: any) => ({
        ...item,
        itemId: item.itemId || item.item_id,
        itemCode: item.itemCode || item.item_code,
        description: item.description,
        stockUom: item.stockUom || item.stock_uom,
        sellingPrice: Number(item.sellingPrice ?? item.selling_price ?? 0),
        quantityOnHand: Number(item.quantityOnHand ?? item.quantity_on_hand ?? 0),
        averageCost: Number(item.averageCost ?? item.average_cost ?? 0),
        inventoryValue: Number(item.inventoryValue ?? item.inventory_value ?? 0),
      }));
    },
  });
};