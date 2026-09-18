import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../context/SessionContext.jsx";

/**
 * Stands in for a Server Component doing `if (!user) redirect("/login")`.
 * Renders nothing while the initial /auth/me call is in flight so a
 * signed-in visitor never flashes the login page first.
 */
export function RequireAuth({ children }) {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/** Stands in for (auth)/layout.tsx's `if (user) redirect("/")`. */
export function RequireGuest({ children }) {
  const { user, loading } = useSession();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}
