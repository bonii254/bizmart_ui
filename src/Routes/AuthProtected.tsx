// src/AuthProtected.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../Components/Hooks/useAuth"; 
import { Spinner } from "reactstrap";

const AuthProtected = ( { children }: { children: React.ReactNode }) => {
  const { data: user, isLoading, isError } = useUser();

  if (isLoading) {
    return <Spinner color="primary" />; // Simple loading
  }

  if (isError || !user) {
    return <Navigate to={{ pathname: "/login" }} />;
  }

  return <>{children}</>;
};

export default AuthProtected;