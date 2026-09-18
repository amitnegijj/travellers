import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { SignupForm } from "./SignupForm.jsx";

export function SignupPage() {
  useDocumentTitle("Create account");

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Create your account</h1>
      <p className="mt-1.5 text-sm text-[var(--text-muted)]">
        Start logging routes that actually help other travellers.
      </p>

      <SignupForm />

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
