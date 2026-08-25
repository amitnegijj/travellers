"use client";

import {
  Bell, Bookmark, Compass, Home, LogOut, Map as MapIcon, MessageSquare,
  Plus, Search, Settings, Sparkles, User, Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Avatar, buttonClass } from "@/components/ui";

const PRIMARY = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

// Visible so the product shape is legible, but honestly labelled — these are
// not built yet and must not pretend to be.
const PHASE_2 = [
  { label: "Trips", icon: Sparkles },
  { label: "Communities", icon: Users },
  { label: "Messages", icon: MessageSquare },
  { label: "Notifications", icon: Bell },
];

const MOBILE_TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

export function AppShell({
  user, rail, children,
}: {
  user: SessionUser | null;
  rail?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => setMenuOpen(false), [pathname]);

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      {/* ============================================================ top bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--ai)] text-white shadow-[var(--shadow-sm)]">
              <MapIcon size={19} strokeWidth={2.6} />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[15px] font-extrabold tracking-tight text-[var(--text)]">
                Travelora
              </span>
              <span className="block text-[10px] font-medium text-[var(--text-faint)]">
                Travel. Share. Inspire.
              </span>
            </span>
          </Link>

          <form action="/explore" role="search" className="mx-auto hidden w-full max-w-lg md:block">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
              />
              <input
                name="q"
                placeholder="Where do you want to go?"
                aria-label="Search destinations, journeys and people"
                className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--surface-2)]
                           pl-11 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]
                           transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)]
                           focus:outline-none focus:ring-4 focus:ring-[var(--brand)]/15"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/journeys/new"
                  className={cn(buttonClass("create", "sm"), "gap-1.5 md:hidden")}
                  aria-label="Create journey"
                >
                  <Plus size={16} strokeWidth={2.6} />
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    aria-label="Account menu"
                    className="rounded-full transition-transform hover:scale-105"
                  >
                    <Avatar name={user.displayName} src={user.avatarUrl} size={36} />
                  </button>

                  {menuOpen ? (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
                      <div
                        role="menu"
                        className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-[var(--radius-lg)]
                                   border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]"
                      >
                        <div className="flex items-center gap-3 border-b border-[var(--border)] p-3.5">
                          <Avatar name={user.displayName} src={user.avatarUrl} size={38} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[var(--text)]">
                              {user.displayName}
                            </p>
                            <p className="truncate text-xs text-[var(--text-faint)]">@{user.handle}</p>
                          </div>
                        </div>
                        <Link href={`/profile/${user.handle}`} role="menuitem" className={menuItem}>
                          <User size={15} /> My profile
                        </Link>
                        <Link href="/settings" role="menuitem" className={menuItem}>
                          <Settings size={15} /> Edit profile
                        </Link>
                        <button onClick={logout} role="menuitem" className={cn(menuItem, "w-full text-[var(--danger)]")}>
                          <LogOut size={15} /> Sign out
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonClass("ghost", "sm")}>Sign in</Link>
                <Link href="/signup" className={buttonClass("primary", "sm")}>Join free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ====================================================== 3-column body */}
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 lg:px-6">
        {/* sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 overflow-y-auto py-5 lg:block"
               style={{ width: "var(--sidebar-w)" }}>
          {user ? (
            <Link href="/journeys/new" className={cn(buttonClass("create", "md"), "mb-5 w-full")}>
              <Plus size={17} strokeWidth={2.6} /> Create
            </Link>
          ) : (
            <Link href="/signup" className={cn(buttonClass("primary", "md"), "mb-5 w-full")}>
              Join Travelora
            </Link>
          )}

          <nav aria-label="Main" className="space-y-1">
            {PRIMARY.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius)] px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  isActive(href)
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                )}
              >
                <Icon size={18} strokeWidth={2.2} />
                {label}
              </Link>
            ))}

            {user ? (
              <Link
                href={`/profile/${user.handle}`}
                aria-current={isActive("/profile") ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius)] px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  isActive("/profile")
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                )}
              >
                <User size={18} strokeWidth={2.2} /> Profile
              </Link>
            ) : null}
          </nav>

          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <p className="mb-2 px-3.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
              Coming in Phase 2
            </p>
            <ul className="space-y-0.5">
              {PHASE_2.map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="flex cursor-not-allowed items-center gap-3 rounded-[var(--radius)] px-3.5 py-2 text-sm font-medium text-[var(--text-faint)] opacity-55"
                  title="Not built yet — Phase 2"
                >
                  <Icon size={17} />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* main */}
        <main id="main" className="min-w-0 flex-1 py-5 pb-28 lg:pb-10">{children}</main>

        {/* right rail */}
        {rail ? (
          <aside
            className="sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 overflow-y-auto py-5 xl:block"
            style={{ width: "var(--rail-w)" }}
            aria-label="Highlights"
          >
            {rail}
          </aside>
        ) : null}
      </div>

      {/* ======================================================= mobile tabs */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-center px-2">
          {MOBILE_TABS.slice(0, 2).map((t) => (
            <TabLink key={t.href} {...t} active={isActive(t.href)} />
          ))}

          <Link
            href={user ? "/journeys/new" : "/login"}
            className="flex flex-col items-center justify-center py-2"
            aria-label="Create journey"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--ai)] text-white shadow-lg">
              <Plus size={21} strokeWidth={2.8} />
            </span>
          </Link>

          {MOBILE_TABS.slice(2).map((t) => (
            <TabLink key={t.href} {...t} active={isActive(t.href)} />
          ))}
        </div>
      </nav>
    </div>
  );
}

const menuItem =
  "flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors";

function TabLink({
  href, label, icon: Icon, active,
}: {
  href: string; label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
        active ? "text-[var(--brand)]" : "text-[var(--text-faint)]"
      )}
    >
      <Icon size={20} strokeWidth={active ? 2.6 : 2} />
      {label}
    </Link>
  );
}
