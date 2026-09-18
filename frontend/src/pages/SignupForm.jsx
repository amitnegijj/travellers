import { signupSchema } from "../validation/schemas.js";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useSession } from "../context/SessionContext.jsx";
import { Button, Field, Input } from "../components/ui/index.js";

export function SignupForm() {
  const navigate = useNavigate();
  const { refresh } = useSession();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [handle, setHandle] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const form = new FormData(e.currentTarget);
    const input = {
      displayName: String(form.get("displayName") ?? "").trim(),
      handle: String(form.get("handle") ?? "").trim().toLowerCase(),
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    };

    const parsed = signupSchema.safeParse(input);
    if (!parsed.success) {
      const errors = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
      setFieldErrors(errors);
      return;
    }

    setPending(true);
    try {
      await api.post("/api/v1/auth/signup", parsed.data);
      await refresh();
      navigate("/");
    } catch (err) {
      setFormError(err.message ?? "Could not create your account.");
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

      <Field label="Your name" htmlFor="displayName" error={fieldErrors.displayName}>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          placeholder="Arjun Mehta"
          aria-invalid={!!fieldErrors.displayName}
          required
        />
      </Field>

      <Field
        label="Handle"
        htmlFor="handle"
        error={fieldErrors.handle}
        hint="Lowercase letters, numbers and underscores. This is your profile URL."
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-[var(--text-faint)]">@</span>
          <Input
            id="handle"
            name="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            autoComplete="username"
            placeholder="arjun_rides"
            aria-invalid={!!fieldErrors.handle}
            required
          />
        </div>
      </Field>

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

      <Field
        label="Password"
        htmlFor="password"
        error={fieldErrors.password}
        hint="At least 8 characters."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!fieldErrors.password}
          required
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : null}
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
