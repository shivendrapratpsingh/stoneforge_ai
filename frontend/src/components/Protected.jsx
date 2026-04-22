import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function Protected({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}
