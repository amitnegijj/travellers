import type { Metadata } from "next";
import { THEME_INIT_SCRIPT } from "@/components/theme-toggle";
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
    // Light is the default, so it is what the server renders. The inline script
    // below rewrites data-theme before first paint if the visitor has chosen
    // otherwise; "system" removes the attribute and lets the CSS media query win.
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
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
