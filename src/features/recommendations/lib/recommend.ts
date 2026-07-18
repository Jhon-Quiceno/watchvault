import type { LibraryEntry, SimilarMediaSummary } from "@/types/media";

export interface Recommendation {
  id: string;
  title: string;
  posterUrl: string | null;
  score: number;
  reason: string;
}

function preferenceWeights(entries: LibraryEntry[]) {
  const genreWeight = new Map<string, number>();
  const studioWeight = new Map<string, number>();
  const directorWeight = new Map<string, number>();

  for (const entry of entries) {
    // Entries the user rated highly or marked favorite count more; entries
    // they dropped push the opposite direction so recommendations don't
    // repeat what didn't work.
    const weight =
      (entry.favorite ? 2 : 0) +
      (entry.personalRating ?? 5) / 5 -
      (entry.status === "dropped" ? 3 : 0);

    for (const genre of entry.media.genres) {
      genreWeight.set(genre, (genreWeight.get(genre) ?? 0) + weight);
    }
    for (const studio of entry.media.productionCompanies) {
      studioWeight.set(studio, (studioWeight.get(studio) ?? 0) + weight);
    }
    if (entry.media.director) {
      directorWeight.set(entry.media.director, (directorWeight.get(entry.media.director) ?? 0) + weight);
    }
  }

  return { genreWeight, studioWeight, directorWeight };
}

/**
 * Simple content-based recommender: scores each library entry's "similar"
 * titles against the user's genre/studio/director preferences, derived from
 * ratings and favorites. This is the placeholder the brief asks for ahead of
 * a future LLM-backed recommender — same shape of output, swappable engine.
 */
export function buildRecommendations(entries: LibraryEntry[], limit = 12): Recommendation[] {
  if (entries.length === 0) return [];

  const { genreWeight, studioWeight, directorWeight } = preferenceWeights(entries);
  const inLibrary = new Set(entries.map((entry) => entry.media.id));
  const candidates = new Map<string, { summary: SimilarMediaSummary; score: number; sourceGenres: string[] }>();

  for (const entry of entries) {
    for (const similar of entry.media.similar ?? []) {
      if (inLibrary.has(similar.id) || candidates.has(similar.id)) continue;
      const genreScore = entry.media.genres.reduce(
        (sum, genre) => sum + (genreWeight.get(genre) ?? 0),
        0,
      );
      const studioScore = entry.media.productionCompanies.reduce(
        (sum, studio) => sum + (studioWeight.get(studio) ?? 0),
        0,
      );
      const directorScore = entry.media.director
        ? (directorWeight.get(entry.media.director) ?? 0)
        : 0;
      candidates.set(similar.id, {
        summary: similar,
        score: genreScore + studioScore * 0.6 + directorScore * 0.8,
        sourceGenres: entry.media.genres.slice(0, 2),
      });
    }
  }

  return [...candidates.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((candidate) => ({
      id: candidate.summary.id,
      title: candidate.summary.title,
      posterUrl: candidate.summary.posterUrl,
      score: candidate.score,
      reason:
        candidate.sourceGenres.length > 0
          ? `Porque te gusta ${candidate.sourceGenres.join(" y ")}`
          : "Similar a títulos de tu vault",
    }));
}
