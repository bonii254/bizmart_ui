export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SalesReceiptDocument {
  documentId: string;
  documentNumber: string;
  total: number;
  postedAt: string;
}

export type PaymentMethodCode = 'CASH' | 'CARD' | 'MOBILE';

export interface SalesReceiptLinePayload {
  itemId: string;
  quantity: number;
  unitPrice: number;
  uomCode: string;
}

export interface CreateSalesReceiptPayload {
  warehouseId: string;
  customerId: string;
  operatorId: string;
  paidAmount: number;
  paymentMethodCode: PaymentMethodCode;
  bankId: string;
  paymentReference: string;
  lines: SalesReceiptLinePayload[];
}

export type CreateSalesReceiptResponse = ApiResponse<SalesReceiptDocument>;

export type GetSalesReceiptResponse = ApiResponse<SalesReceiptDocument>;

export interface SalesTransaction {
  invoice_id: string;
  invoice_number: string;
  sold_at: string;
  warehouse_code: string;
  customer_name: string;
  operator_name: string;
  total: number;
  paid: number;
  payment_method_code: PaymentMethodCode;
  bank_name: string;
  payment_reference: string;
}

export interface SalesTransactionQueryParams {
  fromDate?: string;
  toDate?: string;
  customerId?: string;
  operatorId?: string;
}

export type GetSalesTransactionsResponse = ApiResponse<SalesTransaction[]>;

export interface SalesReturnLineRequest {
  itemId: string;
  quantity: number;
  unitPrice: number;
  uomCode: string;
}

export interface CreateSalesReturnRequest {
  sourceInvoiceId: string;
  warehouseId: string;
  operatorId: string;
  refundBankId: string;
  paymentMethodCode: string;
  paymentReference: string;
  reasonCode: string;
  lines: SalesReturnLineRequest[];
}

export interface SalesReturnResultData {
  documentId: string;
  documentNumber: string;
  total: number;
  postedAt: string;
}

export interface SalesReturnResponse {
  success: boolean;
  message: string;
  data: SalesReturnResultData;
}