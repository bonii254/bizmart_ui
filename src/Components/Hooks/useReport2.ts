import { useQuery } from "@tanstack/react-query";
import { 
    CashTransactionService,
    CustomerStatementService,
    SupplierStatementService,
    getInventoryValuation,
    OperatorSalesSummaryService,
    SalesPaymentSummaryService,
    DailyTillSummaryService,
    getMonthlyInventoryStatement,
    CustomerBalanceService,
    GoodsReceiptService,
    CustomerInvoicesService,
    SupplierInvoicesService,
    StockTakeBrowseService,
    StockTakeTransactionDetailService
 } from "../../services/reportservice2";
import { 
    CashTransactionQueryParams,
    CustomerStatementQueryParams,
    SupplierStatementQueryParams,
    InventoryValuationQueryParams,
    OperatorSalesSummaryQueryParams,
    SalesPaymentSummaryQueryParams,
    DailyTillSummaryQueryParams,
    MonthlyInventoryStatementQueryParams,
    CustomerBalanceData,
    GoodsReceiptQueryParams,
    StockTakeBrowseQueryParams,
    StockTakeTransactionDetail, 
    StockTakeTransactionDetailQueryParams
} from "../../types/reports2";

export const useCashTransactions = (params?: CashTransactionQueryParams) => {
  return useQuery({
    queryKey: ["cash-transactions", params],
    queryFn: () => CashTransactionService.getCashTransactions(params),
    staleTime: 5000,
  });
};

export const useCustomerStatement = (params?: CustomerStatementQueryParams) => {
  return useQuery({
    queryKey: ["customer-statement", params],
    queryFn: () => CustomerStatementService.getCustomerStatement(params!),
    enabled: !!params?.customerId, 
    staleTime: 5000,
  });
};

export const useSupplierStatement = (params?: SupplierStatementQueryParams) => {
  return useQuery({
    queryKey: ['supplier-statement', params],
    queryFn: () => SupplierStatementService.getSupplierStatement(params!),
    enabled: !!params?.supplierId,
    staleTime: 5 * 60 * 1000, 
  });
};

export const useInventoryValuation = (
  params?: InventoryValuationQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['inventory-valuation', params],
    queryFn: () => getInventoryValuation(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useOperatorSalesSummary = (
  params?: OperatorSalesSummaryQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["operator-sales-summary", params],
    queryFn: () => OperatorSalesSummaryService.getOperatorSalesSummary(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSalesPaymentSummary = (
  params?: SalesPaymentSummaryQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["sales-payment-summary", params],
    queryFn: () => SalesPaymentSummaryService.getSalesPaymentSummary(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDailyTillSummary = (
  params?: DailyTillSummaryQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["daily-till-summary", params],
    queryFn: () => DailyTillSummaryService.getDailyTillSummary(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMonthlyInventoryStatement = (
  params?: MonthlyInventoryStatementQueryParams,
  options?: { enabled?: boolean}
) => {
  return useQuery({
    queryKey: ['monthlyInventoryStatement', params],
    queryFn: () => getMonthlyInventoryStatement(params),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCustomerBalance = (customerId?: string | null) => {
  return useQuery<CustomerBalanceData>({
    queryKey: ["customer-balance", customerId],
    queryFn: () => CustomerBalanceService.getCustomerBalance(customerId!),
    enabled: !!customerId,
  });
};

export const useGoodsReceipts = (params?: GoodsReceiptQueryParams) => {
  return useQuery({
    queryKey: ["goods-receipts", params],
    queryFn: () => GoodsReceiptService.getGoodsReceipts(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomerInvoices = (customerId?: string | null) => {
  return useQuery({
    queryKey: ["customer-invoices", customerId],
    queryFn: () => CustomerInvoicesService.getCustomerInvoices(customerId!),
    enabled: !!customerId,
  });
};

export const useSupplierInvoices = (supplierId?: string | null) => {
  return useQuery({
    queryKey: ["supplier-invoices", supplierId],
    queryFn: () => SupplierInvoicesService.getSupplierInvoices(supplierId!),
    enabled: !!supplierId,
  });
};

export const useStockTakeBrowse = (
  params?: StockTakeBrowseQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["stock-take-browse", params],
    queryFn: () => StockTakeBrowseService.getStockTakeBrowse(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export const useStockTakeTransactionsDetail = (
  params?: StockTakeTransactionDetailQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery<StockTakeTransactionDetail[]>({
    queryKey: ["stock-take-transactions-detail", params],
    queryFn: async () => {
      const res = await StockTakeTransactionDetailService.getStockTakeTransactionsDetail(params);
      const raw = res as any;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw.data)) return raw.data;
      return [];
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};