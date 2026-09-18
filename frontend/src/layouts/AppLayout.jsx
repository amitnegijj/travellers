import { Outlet } from "react-router-dom";
import { AppShell } from "../components/app-shell.jsx";
import { HomeRail } from "../components/home-rail.jsx";
import { RouteErrorBoundary } from "../components/error-boundary.jsx";

export function AppLayout() {
  return (
    <AppShell rail={<HomeRail />}>
      <RouteErrorBoundary>
        <Outlet />
      </RouteErrorBoundary>
    </AppShell>
  );
}
