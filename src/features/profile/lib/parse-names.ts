import type { LibraryEntry } from "@/types/media";

const MAX_NAMES_PER_BATCH = 50;
const TRAILING_YEAR = /\s*\((\d{4})\)\s*$/;

export interface ParsedNameItem {
  raw: string;
  query: string;
  yearHint: number | null;
}

export interface ParseNameListResult {
  items: ParsedNameItem[];
  duplicatesRemoved: number;
  truncated: number;
}

export function parseNameList(raw: string): ParseNameListResult {
  const lines = raw
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  const seen = new Map<string, string>();
  let duplicatesRemoved = 0;
  for (const line of lines) {
    const key = line.toLowerCase();
    if (seen.has(key)) {
      duplicatesRemoved += 1;
    } else {
      seen.set(key, line);
    }
  }

  const unique = Array.from(seen.values());
  const truncated = Math.max(0, unique.length - MAX_NAMES_PER_BATCH);

  const items: ParsedNameItem[] = unique.slice(0, MAX_NAMES_PER_BATCH).map((line) => {
    const match = line.match(TRAILING_YEAR);
    const yearHint = match?.[1] ? Number.parseInt(match[1], 10) : null;
    const query = match ? line.slice(0, match.index).trim() : line;
    return { raw: line, query, yearHint };
  });

  return { items, duplicatesRemoved, truncated };
}

export function buildNameExport(entries: LibraryEntry[]): string {
  return entries.map((entry) => `${entry.media.title} (${entry.media.year ?? "?"})`).join("\n");
}
