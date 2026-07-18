"use client";

import type { ReactNode } from "react";
import { Check, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { PosterImage } from "@/components/shared/poster-image";

/**
 * Generic poster tile used across search, library, lists, and recommendations.
 * The poster area accepts overlays (badges, hover actions) so each feature can
 * layer its own affordances without duplicating the card shell.
 */
export function MediaCard({
  posterUrl,
  title,
  subtitle,
  rating,
  badge,
  overlay,
  onClick,
  className,
  selected,
}: {
  posterUrl: string | null;
  title: string;
  subtitle?: string;
  rating?: number | null;
  badge?: ReactNode;
  overlay?: ReactNode;
  onClick?: () => void;
  className?: string;
  /** Opt-in selection affordance (e.g. library bulk actions). Undefined hides it entirely. */
  selected?: boolean;
}) {
  const interactive = Boolean(onClick);
  const selectable = selected !== undefined;
  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={selectable ? selected : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "group hover-lift focus-visible:ring-ring/60 flex flex-col gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2",
        interactive && "cursor-pointer",
        className,
      )}
    >
      <div
        className={cn(
          "border-border/60 bg-muted relative aspect-[2/3] overflow-hidden rounded-xl border transition-colors",
          selected && "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
      >
        <PosterImage
          src={posterUrl}
          alt={title}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {(badge || selectable) && (
          <div className="absolute left-2 top-2 flex flex-wrap items-center gap-1">
            {selectable && (
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white/70 bg-black/40",
                )}
              >
                {selected && <Check className="size-3.5" />}
              </span>
            )}
            {badge}
          </div>
        )}
        {rating != null && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </div>
        )}
        {overlay && (
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100">
            {overlay}
          </div>
        )}
      </div>
      <div className="px-0.5">
        <p className="truncate text-sm font-medium leading-tight" title={title}>
          {title}
        </p>
        {subtitle && <p className="text-muted-foreground truncate text-xs">{subtitle}</p>}
      </div>
    </div>
  );
}
