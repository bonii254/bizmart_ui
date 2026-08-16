// src/services/authService.ts
import { APIClient } from "../helpers/api_helper";
import {
  LoginPayload,
  LoginResponse,
  LogoutResponse,
} from "../types/auth";

const api = new APIClient();

export const loginApi = (payload: LoginPayload): Promise<LoginResponse> => {
  return api.create("/api/security/logins", payload);
};

export const logoutApi = (sessionId: string): Promise<LogoutResponse> => {
  return api.create(`/api/security/${sessionId}/logout`, {});
};