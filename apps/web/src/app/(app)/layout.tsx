import { AppShell } from "@/components/app-shell";
import { HomeRail } from "@/components/home-rail";
import { getSessionUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <AppShell user={user} rail={<HomeRail />}>
      {children}
    </AppShell>
  );
}
