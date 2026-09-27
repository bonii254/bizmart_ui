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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CustomerStatementItem {
  posted_at: string;
  transaction_type: 'sale' | 'payment' | string;
  document_number: string;
  debit: number;
  credit: number;
  running_balance: number;
}

export type CustomerStatementReportResponse = ApiResponse<CustomerStatementItem[]>;

export interface CustomerStatementQueryParams {
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface SupplierStatementItem {
  posted_at: string;
  transaction_type: string; 
  document_number: string;
  debit: number;
  credit: number;
  running_balance: number;
}

export interface SupplierStatementQueryParams {
  supplierId: string;
  fromDate?: string;
  toDate?: string;
}

export interface SupplierStatementResponse {
  success: boolean;
  message: string;
  data: SupplierStatementItem[];
}