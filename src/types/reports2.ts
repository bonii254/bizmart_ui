export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CashTransaction {
  cash_transaction_id: string;
  document_number: string;
  transaction_type: 'sale_deposit' | string;
  posted_at: string;
  operator_name: string;
  bank_name: string | null;
  payment_method_code: 'CASH' | 'MOBILE' | string;
  amount: number;
  reference: string;
  source_document_number: string;
}

export type CashTransactionsResponse = ApiResponse<CashTransaction[]>;

export interface CashTransactionQueryParams {
  fromDate?: string;
  toDate?: string;
  paymentMethodCode?: string;
  transactionType?: string;
  operatorName?: string;
  searchQuery?: string;
  pageNumber?: number;
  pageSize?: number;
}