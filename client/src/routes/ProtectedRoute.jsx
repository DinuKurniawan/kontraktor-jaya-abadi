import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ScreenLoader from "../components/admin/ScreenLoader.jsx";

// Pembatas rute: hanya user yang sudah login boleh masuk area /admin
export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <ScreenLoader />;
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return children;
}
