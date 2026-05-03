import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Full-screen loading spinner shown while the auth bootstrap is in flight. */
function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
    </div>
  );
}

/**
 * Route guard that requires any signed-in user. Renders a spinner while the
 * initial `apiGetMe` is pending and redirects unauthenticated visitors to
 * the login page.
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/**
 * Stricter route guard that additionally requires the `admin` role.
 * Non-admins are sent home instead of to the login page.
 */
export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}
