/** Composite key identifying one episode within a library entry's progress. */
export function episodeKey(seasonNumber: number, episodeNumber: number): string {
  return `${seasonNumber}:${episodeNumber}`;
}

export function toggleEpisodeKey(
  keys: string[],
  seasonNumber: number,
  episodeNumber: number,
): string[] {
  const key = episodeKey(seasonNumber, episodeNumber);
  return keys.includes(key) ? keys.filter((existing) => existing !== key) : [...keys, key];
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
