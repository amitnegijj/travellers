"use client";

import { Button, ErrorState } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-12">
      <ErrorState
        title="This page didn't load"
        description={
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something broke on our side. Try again in a moment."
        }
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
