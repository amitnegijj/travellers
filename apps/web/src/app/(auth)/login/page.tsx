import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Welcome back</h1>
      <p className="mt-1.5 text-sm text-[var(--text-muted)]">
        Sign in to save routes and log your own journeys.
      </p>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        New here?{" "}
        <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] p-3">
        <p className="text-xs font-medium text-[var(--text)]">Demo account</p>
        <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
          arjun@example.com · password123
        </p>
      </div>
    </>
  );
}
