// Generic API Response Wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginPayload {
  userName: string;
  password: string;
  workstation: string;
}

export interface LoginData {
  sessionId: string;
  operatorId: string;
  userName: string;
  roleCode: string;
  loginAt: string;
}

export type LoginResponse = ApiResponse<LoginData>;

export interface LogoutParams {
  sessionId: string;
}

export type LogoutResponse = ApiResponse<string>;