import { Supplier } from './supplier';
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

export interface InventoryValuationItem {
  warehouse_code: string;
  item_code: string;
  description: string;
  stock_uom: string;
  quantity_on_hand: number;
  average_cost: number;
  inventory_value: number;
}

export interface InventoryValuationQueryParams {
  warehouseId?: string;
  itemId?: string;
}

export interface InventoryValuationResponse {
  success: boolean;
  message: string;
  data: InventoryValuationItem[];
}

export interface OperatorSalesSummaryItem {
  operator_id: string;
  operator_name: string;
  invoice_count: number;
  sales_total: number;
  paid_total: number;
  credit_total: number;
  average_invoice_value: number;
}

export interface OperatorSalesSummaryQueryParams {
  fromDate?: string;
  toDate?: string;
  operatorId?: string;
}

export type OperatorSalesSummaryResponse = ApiResponse<OperatorSalesSummaryItem[]>;

export interface SalesPaymentSummaryItem {
  payment_method_code: string;
  bank_name: string;
  operator_name: string;
  sale_count: number;
  sales_total: number;
  paid_total: number;
  outstanding_total: number;
}

export interface SalesPaymentSummaryQueryParams {
  fromDate?: string;
  toDate?: string;
  operatorId?: string;
  bankId?: string;
  paymentMethodCode?: string;
}

export type SalesPaymentSummaryResponse = ApiResponse<SalesPaymentSummaryItem[]>;

export interface DailyTillSummaryItem {
  period_date: string;
  operator_name: string;
  bank_name: string;
  payment_method_code: string;
  sale_deposits: number;
  payments: number;
  withdrawals: number;
  net_bank_movement: number;
  reason_code: string;
  reason_description: string;
}

export interface DailyTillSummaryQueryParams {
  fromDate?: string;
  toDate?: string;
  operatorId?: string;
  bankId?: string;
}

export type DailyTillSummaryResponse = ApiResponse<DailyTillSummaryItem[]>;

export interface MonthlyInventoryStatementItem {
  period_month: string;
  posted_at: string;
  warehouse_code: string;
  item_code: string;
  description: string;
  stock_uom: string;
  transaction_type: 'goods_receipt' | 'sale' | 'stock_take' | string;
  reference_number: string;
  quantity: number;
  running_balance: number;
}

export interface MonthlyInventoryStatementQueryParams {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  itemId?: string;
}

export interface MonthlyInventoryStatementResponse {
  success: boolean;
  message: string;
  data: MonthlyInventoryStatementItem[];
}

export interface CustomerBalanceData {
  customerId: string;
  balance: number;
  updatedAt: string;
}

export interface CustomerBalanceResponse {
  success: boolean;
  message: string;
  data: CustomerBalanceData;
}

export interface GoodsReceiptQueryParams {
  fromDate?: string; 
  toDate?: string;  
  warehouseId?: string;
  supplierId?: string;
  operatorId?: string;
}

export interface GoodsReceiptItem {
  receipt_id: string;
  goods_receipt_number: string;
  received_at: string;
  warehouse_code: string;
  supplier_code: string;
  supplier_name: string;
  operator_name: string;
  receipt_total: number;
  reversed_total: number;
  outstanding_total: number;
}

export interface GoodsReceiptListResponse {
  success: boolean;
  message: string;
  data: GoodsReceiptItem[];
}

export interface CustomerInvoice {
  invoiceId: string;
  invoiceNumber: string;
  warehouseCode: string;
  soldAt: string;
  invoiceTotal: number;
  initialPayment: number;
  returnedAmount: number;
  allocatedPayment: number;
  invoiceBalance: number;
}

export interface CustomerInvoicesResponse {
  success: boolean;
  message: string;
  data: CustomerInvoice[];
}

export interface SupplierInvoice {
  goodsReceiptId: string;
  goodsReceiptNumber: string;
  warehouseCode: string;
  receivedAt: string;
  invoiceTotal: number;
  allocatedPayment: number;
  invoiceBalance: number;
}

export interface SupplierInvoicesResponse {
  success: boolean;
  message: string;
  data: SupplierInvoice[];
}