import { Navigate } from "react-router-dom";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = sessionStorage.getItem("crm_authenticated") === "true";
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
