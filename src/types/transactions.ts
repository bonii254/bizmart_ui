export type CashMovementType = 'Payment' | 'Withdrawal';

export interface CreateCashMovementRequest {
  movementType: CashMovementType;
  operatorId: string;
  bankId: string;
  amount: number;
  reference: string;
}

export interface CashMovementResultData {
  documentId: string;
  documentNumber: string;
  total: number;
  postedAt: string;
}

export interface CashMovementResponse {
  success: boolean;
  message: string;
  data: CashMovementResultData;
}