export interface Operator {
  operatorId: string;
  operatorCode: string;
  userName: string;
  displayName: string;
  roleCode: string;
  canDiscount: boolean;
  canVoid: boolean;
  canWithdraw: boolean;
  isActive: boolean;
}

export interface OperatorPayload {
  operatorCode: string;
  userName: string;
  displayName: string;
  roleCode: string;
  canDiscount: boolean;
  canVoid: boolean;
  canWithdraw: boolean;
  isActive: boolean;
}

export interface CreateOperatorPasswordPayload {
  password: string;
}

export interface CreateOperatorPasswordResponse {
  success: boolean;
  message: string;
  data: string;
}

export type UpdateOperatorPayload = Partial<OperatorPayload>;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type OperatorListResponse = ApiResponse<Operator[]>;
export type SingleOperatorResponse = ApiResponse<Operator>;
export type OperatorMutationResponse = ApiResponse<string>;