import { useQuery } from "@tanstack/react-query";
import { 
    CashTransactionService,
    CustomerStatementService,
    SupplierStatementService,
    getInventoryValuation,
    OperatorSalesSummaryService,
    SalesPaymentSummaryService,
    DailyTillSummaryService,
    getMonthlyInventoryStatement
 } from "../../services/reportservice2";
import { 
    CashTransactionQueryParams,
    CustomerStatementQueryParams,
    SupplierStatementQueryParams,
    InventoryValuationQueryParams,
    OperatorSalesSummaryQueryParams,
    SalesPaymentSummaryQueryParams,
    DailyTillSummaryQueryParams,
    MonthlyInventoryStatementQueryParams
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