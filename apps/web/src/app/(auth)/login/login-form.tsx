"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorState, Field, Input } from "@/components/ui";
import { loginSchema } from "@/lib/validation";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const form = new FormData(e.currentTarget);
    const input = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setFormError(data?.error?.message ?? "Could not sign in. Try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setFormError("Network error — is the server running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
      {formError ? (
        <div
          role="alert"
          className="rounded-[var(--radius)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]"
        >
          {formError}
        </div>
      ) : null}

      <Field label="Email" htmlFor="email" error={fieldErrors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!fieldErrors.email}
          required
        />
      </Field>

      <Field label="Password" htmlFor="password" error={fieldErrors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!fieldErrors.password}
          required
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
