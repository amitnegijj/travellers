import { loginSchema } from "../lib/validation.js";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useSession } from "../context/session.jsx";
import { Button, Field, Input } from "../components/ui.jsx";

export function LoginForm() {
  const navigate = useNavigate();
  const { refresh } = useSession();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  async function onSubmit(e) {
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
      const errors = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
      setFieldErrors(errors);
      return;
    }

    setPending(true);
    try {
      await api.post("/api/v1/auth/login", parsed.data);
      await refresh();
      navigate("/");
    } catch (err) {
      setFormError(err.message ?? "Could not sign in. Try again.");
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
