import { useQuery } from "@tanstack/react-query";
import { 
    CashTransactionService,
    CustomerStatementService,
    SupplierStatementService
 } from "../../services/reportservice2";
import { 
    CashTransactionQueryParams,
    CustomerStatementQueryParams,
    SupplierStatementQueryParams
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
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};