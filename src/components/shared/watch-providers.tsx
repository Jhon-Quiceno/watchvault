import type { WatchProvider } from "@/types/media";
import { PosterImage } from "@/components/shared/poster-image";

const TYPE_LABELS: Record<WatchProvider["type"], string> = {
  stream: "Streaming",
  rent: "Alquiler",
  buy: "Compra",
};

const TYPE_ORDER: WatchProvider["type"][] = ["stream", "rent", "buy"];

/**
 * Small logo badges for where a title can be watched. Providers may not
 * return this data at all (AniList never does), so the section renders
 * nothing rather than an empty/broken block.
 */
export function WatchProviders({ providers }: { providers?: WatchProvider[] }) {
  if (!providers || providers.length === 0) return null;

  const grouped = new Map<WatchProvider["type"], WatchProvider[]>();
  for (const provider of providers) {
    const bucket = grouped.get(provider.type) ?? [];
    bucket.push(provider);
    grouped.set(provider.type, bucket);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        Dónde ver
      </p>
      <div className="flex flex-col gap-1.5">
        {TYPE_ORDER.filter((type) => grouped.has(type)).map((type) => (
          <div key={type} className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground w-14 shrink-0 text-xs">
              {TYPE_LABELS[type]}
            </span>
            {grouped.get(type)?.map((provider) => (
              <div
                key={`${type}-${provider.name}`}
                title={provider.name}
                className="border-border/60 bg-muted relative size-7 shrink-0 overflow-hidden rounded-md border"
              >
                {provider.logoUrl ? (
                  <PosterImage src={provider.logoUrl} alt={provider.name} sizes="28px" />
                ) : (
                  <span className="text-muted-foreground grid h-full place-items-center text-[9px] font-medium">
                    {provider.name.slice(0, 2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
