"use client";

import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, Button, EmptyState, LinkButton, Textarea } from "@/components/ui";
import type { SessionUser } from "@/lib/auth";
import { relativeTime } from "@/lib/utils";
import { commentSchema } from "@/lib/validation";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorHandle: string;
  authorName: string;
  authorAvatar: string | null;
};

export function CommentSection({
  journeyId,
  initialComments,
  currentUser,
}: {
  journeyId: string;
  initialComments: Comment[];
  currentUser: SessionUser | null;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = commentSchema.safeParse({ body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid comment");
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/v1/journeys/${journeyId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "Could not post your comment");
        return;
      }

      const created = await res.json();
      setComments((prev) => [...prev, created]);
      setBody("");
    } catch {
      setError("Network error — try again");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    const previous = comments;
    setComments((prev) => prev.filter((c) => c.id !== id));

    const res = await fetch(`/api/v1/comments/${id}`, { method: "DELETE" });
    if (!res.ok) setComments(previous);
  }

  return (
    <section id="comments">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
        <MessageCircle size={18} />
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      {currentUser ? (
        <form onSubmit={submit} className="mb-6">
          <div className="flex gap-3">
            <Avatar name={currentUser.displayName} src={currentUser.avatarUrl} size={36} />
            <div className="min-w-0 flex-1 space-y-2">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Been here? Add what you learned."
                aria-label="Write a comment"
                aria-invalid={!!error}
                rows={3}
                maxLength={2000}
              />
              {error ? (
                <p role="alert" className="text-xs text-[var(--danger)]">
                  {error}
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--text-faint)]">{body.length}/2000</span>
                <Button type="submit" size="sm" disabled={pending || !body.trim()}>
                  {pending ? <Loader2 size={14} className="animate-spin" /> : null}
                  {pending ? "Posting…" : "Post comment"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3">
          <p className="text-sm text-[var(--text-muted)]">Sign in to join the conversation.</p>
          <LinkButton href="/login" size="sm" variant="secondary">
            Sign in
          </LinkButton>
        </div>
      )}

      {comments.length === 0 ? (
        <EmptyState
          title="No comments yet"
          description="Ask about the route, the costs, or the road conditions."
        />
      ) : (
        <ul className="space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Link href={`/profile/${c.authorHandle}`} className="shrink-0">
                <Avatar name={c.authorName} src={c.authorAvatar} size={36} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${c.authorHandle}`}
                    className="text-sm font-semibold text-[var(--text)] hover:underline"
                  >
                    {c.authorName}
                  </Link>
                  <span className="text-xs text-[var(--text-faint)]">
                    {relativeTime(c.createdAt)}
                  </span>
                  {currentUser?.id === c.authorId ? (
                    <button
                      onClick={() => remove(c.id)}
                      aria-label="Delete comment"
                      className="ml-auto text-[var(--text-faint)] transition-colors hover:text-[var(--danger)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[var(--text-muted)]">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
