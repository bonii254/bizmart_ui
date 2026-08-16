// src/hooks/useAuth.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginApi, logoutApi } from "../../services/authService";
import { getLoggedinUser } from "../../helpers/api_helper";
import { LoginPayload, LoginResponse, LogoutResponse } from "../../types/auth";

export const useAuthMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // LOGIN MUTATION
  const loginMutation = useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
    onSuccess: (response) => {
      if (response?.success && response?.data) {
        sessionStorage.setItem("authUser", JSON.stringify(response));
        
        queryClient.clear();
        navigate("/", { replace: true });
      }
    },
  });

  const logoutMutation = useMutation<LogoutResponse, Error, void>({
    mutationFn: () => {
      const { data: session } = getLoggedinUser();
      const sessionId = session?.sessionId;
      if (!sessionId) {
        return Promise.reject(new Error("No active session found."));
      }
      return logoutApi(sessionId);
    },
    onSuccess: () => {
      sessionStorage.removeItem("authUser");
      queryClient.clear();
      navigate("/login", { replace: true });
    },
    onError: () => {
      // Fallback eviction if logout call fails on backend
      sessionStorage.removeItem("authUser");
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });

  return {
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
  };
};