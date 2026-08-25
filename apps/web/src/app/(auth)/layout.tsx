import { Map as MapIcon, Route, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-9 inline-flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--ai)] text-white shadow-lg">
              <MapIcon size={21} strokeWidth={2.6} />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-[var(--text)]">
                Travelora
              </span>
              <span className="block text-[10px] font-semibold text-[var(--text-faint)]">
                Travel. Share. Inspire.
              </span>
            </span>
          </Link>
          {children}
        </div>
      </div>

      <aside className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1400&q=70"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220]/85 via-[#0b1220]/70 to-[#2563eb]/60" />

        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <blockquote className="max-w-md">
            <p className="text-3xl font-extrabold leading-tight drop-shadow">
              320 km. 7h 20m.<br />Two days. ₹3,250.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              Every journey here carries its real route, its real cost, and what the roads were
              actually like — not just a photo and a caption.
            </p>
          </blockquote>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { icon: Route, label: "Real routes", value: "Mapped" },
              { icon: Wallet, label: "Real costs", value: "Itemised" },
              { icon: Users, label: "Real people", value: "Verified" },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-[var(--radius-lg)] border border-white/15 bg-white/10 p-3.5 backdrop-blur-md"
              >
                <Icon size={18} className="mb-2 text-white/90" />
                <p className="text-sm font-extrabold">{value}</p>
                <p className="text-[11px] text-white/65">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
