import { commentSchema } from "../validation/schemas.js";
import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../api/client.js";
import { Avatar, Button, EmptyState, LinkButton, Textarea } from "./ui/index.js";
import { relativeTime } from "../utils/index.js";

export function CommentSection({ journeyId, initialComments, currentUser, onPosted }) {
  const navigate = useNavigate();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);

    const parsed = commentSchema.safeParse({ body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid comment");
      return;
    }

    setPending(true);
    try {
      const created = await api.post(`/api/v1/journeys/${journeyId}/comments`, parsed.data);
      setComments((prev) => [...prev, created]);
      setBody("");
      onPosted?.();
    } catch (err) {
      if (isUnauthorized(err)) {
        navigate("/login");
        return;
      }
      setError(err.message ?? "Could not post your comment");
    } finally {
      setPending(false);
    }
  }

  async function remove(id) {
    const previous = comments;
    setComments((prev) => prev.filter((c) => c.id !== id));
    try {
      await api.delete(`/api/v1/comments/${id}`);
    } catch {
      setComments(previous);
    }
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
          <LinkButton to="/login" size="sm" variant="secondary">
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
              <Link to={`/profile/${c.authorHandle}`} className="shrink-0">
                <Avatar name={c.authorName} src={c.authorAvatar} size={36} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/profile/${c.authorHandle}`}
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
