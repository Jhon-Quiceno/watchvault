import type { EpisodeInfo } from "@/types/media";

/** Composite key identifying one episode within a library entry's progress. */
export function episodeKey(seasonNumber: number, episodeNumber: number): string {
  return `${seasonNumber}:${episodeNumber}`;
}

/**
 * Splits a season/anime's episode list into fixed-size blocks (default 50)
 * for collapsible rendering. Long-running anime like One Piece have 1000+
 * episodes, so rendering everything flat is heavy - chunking lets the UI
 * lazily render only the block the user opens.
 */
export function chunkEpisodes(episodes: EpisodeInfo[], chunkSize = 50): EpisodeInfo[][] {
  const chunks: EpisodeInfo[][] = [];
  for (let index = 0; index < episodes.length; index += chunkSize) {
    chunks.push(episodes.slice(index, index + chunkSize));
  }
  return chunks;
}

export function toggleEpisodeKey(
  keys: string[],
  seasonNumber: number,
  episodeNumber: number,
): string[] {
  const key = episodeKey(seasonNumber, episodeNumber);
  return keys.includes(key) ? keys.filter((existing) => existing !== key) : [...keys, key];
}

/**
 * Checking episode N implies episodes 1..N-1 were already watched, so
 * checking it fans out to fill in any earlier gaps in the same season.
 * Unchecking is intentionally NOT symmetric - it only removes the single
 * key the user clicked, leaving earlier episodes marked as watched.
 */
export function checkThroughEpisode(
  keys: string[],
  seasonNumber: number,
  episodeNumber: number,
): string[] {
  const missing = Array.from({ length: episodeNumber }, (_, index) =>
    episodeKey(seasonNumber, index + 1),
  ).filter((key) => !keys.includes(key));
  return missing.length === 0 ? keys : [...keys, ...missing];
}

export function isSeasonComplete(
  keys: string[],
  seasonNumber: number,
  episodeCount: number,
): boolean {
  if (episodeCount <= 0) return false;
  const prefix = `${seasonNumber}:`;
  return keys.filter((key) => key.startsWith(prefix)).length >= episodeCount;
}

export function toggleSeasonCompletion(
  completedSeasons: number[],
  seasonNumber: number,
  complete: boolean,
): number[] {
  const alreadyComplete = completedSeasons.includes(seasonNumber);
  if (complete && !alreadyComplete) {
    return [...completedSeasons, seasonNumber].sort((a, b) => a - b);
  }
  if (!complete && alreadyComplete) {
    return completedSeasons.filter((season) => season !== seasonNumber);
  }
  return completedSeasons;
}
