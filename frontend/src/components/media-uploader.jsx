import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { api, mediaUrl } from "../api/client.js";
import { cn } from "../lib/utils.js";

const MAX_EDGE = 2560;
const QUALITY = 0.82;

/**
 * Downscale in the browser BEFORE upload. A 12MP phone photo is 4-6 MB;
 * this puts it under ~400 KB. Biggest single cost lever in the product —
 * it cuts storage, egress and processing at the same time.
 */
async function downscale(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  if (!blob) throw new Error("Could not process image");
  return { blob, width, height };
}

export function MediaUploader({ media, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleFiles(files) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);

    const uploaded = [];
    try {
      for (const file of Array.from(files).slice(0, 10)) {
        if (!file.type.startsWith("image/")) continue;

        const { blob, width, height } = await downscale(file);
        const form = new FormData();
        form.append("file", new File([blob], "photo.webp", { type: "image/webp" }));
        form.append("width", String(width));
        form.append("height", String(height));

        try {
          uploaded.push(await api.post("/api/v1/media", form));
        } catch (err) {
          setError(err.message ?? "Upload failed");
        }
      }
      if (uploaded.length) onChange([...media, ...uploaded]);
    } catch {
      setError("Could not process that image");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {media.map((m) => (
          <div
            key={m.id}
            className="group relative h-24 w-24 overflow-hidden rounded-[var(--radius)] border border-[var(--border)]"
          >
            <img src={mediaUrl(m.url)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(media.filter((x) => x.id !== m.id))}
              aria-label="Remove photo"
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full
                         bg-black/60 text-white opacity-0 transition-opacity
                         focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            "grid h-24 w-24 place-items-center rounded-[var(--radius)] border-2 border-dashed",
            "border-[var(--border-strong)] text-[var(--text-faint)] transition-colors",
            "hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
          )}
        >
          {busy ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error ? (
        <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-[var(--text-faint)]">
          Photos are resized in your browser before upload — max 2560px, WebP.
        </p>
      )}
    </div>
  );
}
