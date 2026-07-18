import type { LibraryEntry } from "@/types/media";
import type { LibrarySort } from "@/stores/library-filters-store";
import type { MediaType, WatchStatus } from "@/types/media";

export interface LibraryFilterCriteria {
  query: string;
  status: WatchStatus | "all";
  type: MediaType | "all";
  tag: string | null;
  favoritesOnly: boolean;
  sort: LibrarySort;
}

function matches(entry: LibraryEntry, criteria: LibraryFilterCriteria): boolean {
  if (criteria.status !== "all" && entry.status !== criteria.status) return false;
  if (criteria.type !== "all" && entry.media.type !== criteria.type) return false;
  if (criteria.favoritesOnly && !entry.favorite) return false;
  if (criteria.tag && !entry.tags.includes(criteria.tag)) return false;
  if (criteria.query.trim()) {
    const needle = criteria.query.trim().toLowerCase();
    const haystack = `${entry.media.title} ${entry.media.originalTitle}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

function compare(a: LibraryEntry, b: LibraryEntry, sort: LibrarySort): number {
  switch (sort) {
    case "title":
      return a.media.title.localeCompare(b.media.title);
    case "rating":
      return (b.personalRating ?? -1) - (a.personalRating ?? -1);
    case "year":
      return (b.media.year ?? 0) - (a.media.year ?? 0);
    case "recent":
    default:
      return b.updatedAt.localeCompare(a.updatedAt);
  }
}

/** Applies the active filter criteria and sort order to library entries. */
export function filterEntries(
  entries: LibraryEntry[],
  criteria: LibraryFilterCriteria,
): LibraryEntry[] {
  return entries.filter((entry) => matches(entry, criteria)).sort((a, b) => compare(a, b, criteria.sort));
}

/** Distinct tags across the library, sorted alphabetically. */
export function collectTags(entries: LibraryEntry[]): string[] {
  const tags = new Set<string>();
  for (const entry of entries) {
    for (const tag of entry.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}
