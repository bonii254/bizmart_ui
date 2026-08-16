// src/AuthProtected.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getLoggedinUser } from "../helpers/api_helper";

interface AuthProtectedProps {
  children: React.ReactNode;
}

const AuthProtected: React.FC<AuthProtectedProps> = ({ children }) => {
  const location = useLocation();
  const { data: user } = getLoggedinUser();

  // If no active user session exists in sessionStorage, redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AuthProtected;