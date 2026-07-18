import type { LibraryEntry, MediaType } from "@/types/media";

export interface RankedItem {
  label: string;
  count: number;
}

export interface LibraryStats {
  total: number;
  byType: Record<MediaType, number>;
  hoursWatched: number;
  episodesWatched: number;
  avgRating: number | null;
  topGenres: RankedItem[];
  topStudios: RankedItem[];
  topDirectors: RankedItem[];
  topYears: RankedItem[];
  activityByDay: Map<string, number>;
}

function rank(counter: Map<string, number>, limit: number): RankedItem[] {
  return [...counter.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function bump(counter: Map<string, number>, key: string | null | undefined) {
  if (!key) return;
  counter.set(key, (counter.get(key) ?? 0) + 1);
}

/** Aggregates the whole library into the figures the stats view renders. */
export function computeStats(entries: LibraryEntry[]): LibraryStats {
  const byType: Record<MediaType, number> = { movie: 0, series: 0, anime: 0 };
  const genres = new Map<string, number>();
  const studios = new Map<string, number>();
  const directors = new Map<string, number>();
  const years = new Map<string, number>();
  const activityByDay = new Map<string, number>();

  let hoursMinutes = 0;
  let episodesWatched = 0;
  let ratingSum = 0;
  let ratingCount = 0;

  for (const entry of entries) {
    byType[entry.media.type] += 1;

    for (const genre of entry.media.genres) bump(genres, genre);
    for (const studio of entry.media.productionCompanies) bump(studios, studio);
    bump(directors, entry.media.director);
    if (entry.media.year) bump(years, String(entry.media.year));

    const runtime = entry.media.runtimeMinutes ?? 0;
    if (entry.media.type === "movie") {
      if (entry.status === "completed") hoursMinutes += runtime;
    } else {
      episodesWatched += entry.progress.watchedEpisodes;
      hoursMinutes += runtime * entry.progress.watchedEpisodes;
    }

    if (entry.personalRating != null) {
      ratingSum += entry.personalRating;
      ratingCount += 1;
    }

    const day = entry.addedAt.slice(0, 10);
    activityByDay.set(day, (activityByDay.get(day) ?? 0) + 1);
  }

  return {
    total: entries.length,
    byType,
    hoursWatched: Math.round(hoursMinutes / 60),
    episodesWatched,
    avgRating: ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : null,
    topGenres: rank(genres, 8),
    topStudios: rank(studios, 6),
    topDirectors: rank(directors, 6),
    topYears: rank(years, 8),
    activityByDay,
  };
}
