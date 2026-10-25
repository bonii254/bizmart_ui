export interface Bank {
  bankId: string;
  bankCode: string;
  bankName: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  currencyCode: string;
  swiftCode: string;
  isActive: boolean;
}

export interface BankPayload {
  bankCode: string;
  bankName: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  currencyCode: string;
  swiftCode: string;
  isActive: boolean;
}

export type UpdateBankRequest = Partial<BankPayload>;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface BankBalanceData {
  bankId: string;
  balance: number;
  updatedAt: string | null;
}

export interface BankBalanceResponse {
  success: boolean;
  message: string;
  data: BankBalanceData;
}

export interface BankTransaction {
  cashTransactionId: string;
  bankId: string;
  transactionType: string;
  documentNumber: string;
  debit: number;
  credit: number;
  reference: string;
  paymentMethodCode: string | null;
  sourceDocumentNumber: string | null;
  postedAt: string;
}

export interface BankTransactionsResponse {
  success: boolean;
  message: string;
  data: BankTransaction[];
}