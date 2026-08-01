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

export interface BankPayload extends Omit<Bank, 'bankId'> {}

export type UpdateBankRequest = Partial<BankPayload>;

export interface BankListResponse {
  banks: Bank[];
}