import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Travelora — Travel. Share. Inspire.",
    template: "%s · Travelora",
  },
  description:
    "Real routes, real costs, real road conditions. A social travel platform where journeys become travel intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50
                     focus:rounded-[var(--radius)] focus:bg-[var(--accent)] focus:px-4 focus:py-2
                     focus:text-[var(--accent-text)]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
