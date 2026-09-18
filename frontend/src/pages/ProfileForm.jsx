import { profileUpdateSchema } from "../validation/schemas.jsx";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client.jsx";
import { MediaUploader } from "../components/MediaUploader.jsx";
import { Avatar, Button, Card, Field, Input, Textarea } from "../components/ui/index.jsx";
import { useSession } from "../context/SessionContext.jsx";

export function ProfileForm({ profile }) {
  const { refresh } = useSession();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [isPrivate, setIsPrivate] = useState(profile.isPrivate);

  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setFieldErrors({});

    const parsed = profileUpdateSchema.safeParse({
      displayName: displayName.trim(),
      bio: bio.trim() || null,
      location: location.trim() || null,
      avatarUrl: avatarUrl || "",
      isPrivate,
    });

    if (!parsed.success) {
      const errors = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
      setFieldErrors(errors);
      return;
    }

    setPending(true);
    try {
      await api.patch(`/api/v1/profiles/${profile.handle}`, parsed.data);
      setSaved(true);
      // The header avatar/name comes from the session context, not this
      // form's own state — refresh it so the shell picks up the change.
      await refresh();
    } catch (err) {
      setError(err.message ?? "Could not save your profile");
    } finally {
      setPending(false);
    }
  }

  const onAvatarChange = (media) => {
    const latest = media[media.length - 1];
    if (latest) setAvatarUrl(latest.url);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]"
        >
          {error}
        </div>
      ) : null}

      {saved ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--trail)]/30 bg-[var(--trail-soft)] px-4 py-3 text-sm text-[var(--trail)]"
        >
          <Check size={15} /> Profile saved.
        </div>
      ) : null}

      <Card className="space-y-5 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={displayName || profile.handle} src={avatarUrl || null} size={64} />
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-sm font-medium text-[var(--text)]">Profile photo</p>
            <MediaUploader media={[]} onChange={onAvatarChange} />
          </div>
        </div>

        <Field label="Handle" htmlFor="handle" hint="Handles cannot be changed yet.">
          <Input id="handle" value={`@${profile.handle}`} disabled readOnly />
        </Field>

        <Field label="Display name" htmlFor="displayName" error={fieldErrors.displayName}>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            aria-invalid={!!fieldErrors.displayName}
            required
          />
        </Field>

        <Field label="Bio" htmlFor="bio" error={fieldErrors.bio} hint="Max 500 characters.">
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Weekend rider. I log every fuel stop so you don't have to."
          />
        </Field>

        <Field label="Location" htmlFor="location" error={fieldErrors.location}>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Gurgaon, India"
          />
        </Field>

        <label className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--border)] p-3.5">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
          />
          <span>
            <span className="block text-sm font-medium text-[var(--text)]">Private profile</span>
            <span className="block text-xs text-[var(--text-muted)]">
              Your published journeys stay public. This controls profile discoverability.
            </span>
          </span>
        </label>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : null}
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
