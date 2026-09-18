import { Outlet } from "react-router-dom";
import { AppShell } from "../components/AppShell.jsx";
import { HomeRail } from "../components/HomeRail.jsx";
import { RouteErrorBoundary } from "../components/ErrorBoundary.jsx";

export function AppLayout() {
  return (
    <AppShell rail={<HomeRail />}>
      <RouteErrorBoundary>
        <Outlet />
      </RouteErrorBoundary>
    </AppShell>
  );
}
