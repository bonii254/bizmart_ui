export interface ReasonCode {
  reasonCode: string;
  type: string;
  description: string;
  isActive: boolean;
  auditUser: string;
  auditDate: string;
}

export interface CreateReasonCodeRequest {
  reasonCode: string;
  reasonType: string;
  description: string;
  isActive: boolean;
  auditUser: string;
}

export interface GetReasonCodesResponse {
  success: boolean;
  message: string;
  data: ReasonCode[];
}

export interface CreateReasonCodeResponse {
  success: boolean;
  message: string;
  data: string;
}

export interface GetReasonCodeByIdResponse {
  success: boolean;
  message: string;
  data: ReasonCode;
}