export interface CashWithdrawalHeader {
  documentId: string;
  documentNumber: string;
  bankId: string;
  bankName?: string;
  operatorId: string;
  operatorName?: string;
  amount: number;
  reason: string;
  postedAt: string;
}

export interface CashWithdrawalPayload {
  documentNumber?: string;
  bankId: string;
  operatorId: string;
  amount: number;
  reason: string;
}

export interface SingleCashWithdrawalResponse {
  cash_withdrawal_201: CashWithdrawalHeader;
}

export interface CashWithdrawalListResponse {
  cashWithdrawals: CashWithdrawalHeader[];
  availableInTill?: number;
  recordCount?: number;
}