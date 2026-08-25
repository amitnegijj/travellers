import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Create your account</h1>
      <p className="mt-1.5 text-sm text-[var(--text-muted)]">
        Start logging routes that actually help other travellers.
      </p>

      <SignupForm />

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
