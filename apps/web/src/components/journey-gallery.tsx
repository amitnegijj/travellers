"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Photo } from "@/components/ui";

/** Swipeable hero gallery with a 1/N counter, like the mockup. */
export function JourneyGallery({
  photos,
  title,
}: {
  photos: { id: string; url: string }[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) return null;

  const go = (delta: number) =>
    setIndex((i) => (i + delta + photos.length) % photos.length);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-subtle)]">
      <div className="relative aspect-[16/10] sm:aspect-[16/9]">
        {photos.map((p, i) => (
          <Photo
            key={p.id}
            src={p.url}
            alt={i === 0 ? title : ""}
            priority={i === 0}
            className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {photos.length > 1 ? (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65"
            >
              <ChevronRight size={18} />
            </button>

            <span
              className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md"
              aria-live="polite"
            >
              {index + 1}/{photos.length}
            </span>

            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
