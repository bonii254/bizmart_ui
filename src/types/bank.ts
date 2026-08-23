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