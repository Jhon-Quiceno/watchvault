"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Poster/backdrop image with a graceful fallback. Providers occasionally
 * lack artwork, and remote images can fail — either way we render a branded
 * placeholder instead of a broken image.
 */
export function PosterImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw",
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "bg-muted text-muted-foreground/50 grid place-items-center",
          className,
        )}
      >
        <ImageOff className="size-8" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
