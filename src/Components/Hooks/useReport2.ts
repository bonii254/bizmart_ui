import { useQuery } from "@tanstack/react-query";
import { CashTransactionService } from "../../services/reportservice2";
import { CashTransactionQueryParams } from "../../types/reports2";

export const useCashTransactions = (params?: CashTransactionQueryParams) => {
  return useQuery({
    queryKey: ["cash-transactions", params],
    queryFn: () => CashTransactionService.getCashTransactions(params),
    staleTime: 5000,
  });
};