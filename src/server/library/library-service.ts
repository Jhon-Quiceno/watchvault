import { randomUUID } from "node:crypto";

import type { CustomList, LibraryEntry } from "@/types/media";
import type {
  AddToLibraryInput,
  ListInput,
  UpdateEntryInput,
} from "@/lib/schemas/library";
import { getLibraryRepository } from "@/server/repositories";
import { getMediaDetails } from "@/server/providers/metadata-service";

/**
 * Application service for the personal library. Owns the business rules
 * (building an entry snapshot from provider metadata, timestamps, list
 * membership) and delegates persistence to the repository. Route handlers
 * talk to this service, never to the repository directly.
 */

function now(): string {
  return new Date().toISOString();
}

export async function listEntries(): Promise<LibraryEntry[]> {
  const entries = await getLibraryRepository().getAllEntries();
  return [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getEntry(id: string): Promise<LibraryEntry | null> {
  return getLibraryRepository().getEntryById(id);
}

export async function addEntry(input: AddToLibraryInput): Promise<LibraryEntry> {
  const repo = getLibraryRepository();

  const existing = await repo.getAllEntries();
  const duplicate = existing.find(
    (entry) =>
      entry.media.provider === input.provider &&
      entry.media.providerId === input.providerId,
  );
  if (duplicate) return duplicate;

  const media = await getMediaDetails(input.provider, input.providerId, input.type);
  const timestamp = now();
  const entry: LibraryEntry = {
    id: randomUUID(),
    media,
    status: input.status,
    personalRating: null,
    favorite: false,
    notes: "",
    tags: [],
    startedAt: null,
    finishedAt: input.status === "completed" ? timestamp : null,
    rewatchCount: 0,
    progress: { watchedEpisodes: 0, watchedSeasons: 0 },
    addedAt: timestamp,
    updatedAt: timestamp,
  };
  return repo.createEntry(entry);
}

export async function updateEntry(id: string, patch: UpdateEntryInput): Promise<LibraryEntry> {
  const repo = getLibraryRepository();
  const current = await repo.getEntryById(id);
  if (!current) {
    throw new EntryNotFoundError(id);
  }
  const updated: LibraryEntry = {
    ...current,
    ...patch,
    progress: { ...current.progress, ...patch.progress },
    updatedAt: now(),
  };
  return repo.updateEntry(id, updated);
}

export async function removeEntry(id: string): Promise<void> {
  const repo = getLibraryRepository();
  await repo.deleteEntry(id);
  // Keep lists consistent: drop the removed entry from every list.
  const lists = await repo.getAllLists();
  await Promise.all(
    lists
      .filter((list) => list.entryIds.includes(id))
      .map((list) =>
        repo.updateList(list.id, {
          ...list,
          entryIds: list.entryIds.filter((entryId) => entryId !== id),
          updatedAt: now(),
        }),
      ),
  );
}

export async function importEntries(incoming: LibraryEntry[]): Promise<number> {
  const repo = getLibraryRepository();
  const existing = await repo.getAllEntries();
  const byKey = new Map(
    existing.map((entry) => [`${entry.media.provider}:${entry.media.providerId}`, entry]),
  );

  let imported = 0;
  for (const entry of incoming) {
    const key = `${entry.media.provider}:${entry.media.providerId}`;
    if (byKey.has(key)) continue;
    await repo.createEntry({ ...entry, id: entry.id || randomUUID(), updatedAt: now() });
    byKey.set(key, entry);
    imported += 1;
  }
  return imported;
}

export async function listCustomLists(): Promise<CustomList[]> {
  const lists = await getLibraryRepository().getAllLists();
  return [...lists].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createList(input: ListInput): Promise<CustomList> {
  const timestamp = now();
  const list: CustomList = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    coverUrl: input.coverUrl,
    entryIds: input.entryIds,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return getLibraryRepository().createList(list);
}

export async function updateList(id: string, input: ListInput): Promise<CustomList> {
  const repo = getLibraryRepository();
  const current = await repo.getListById(id);
  if (!current) {
    throw new ListNotFoundError(id);
  }
  return repo.updateList(id, { ...current, ...input, updatedAt: now() });
}

export function removeList(id: string): Promise<void> {
  return getLibraryRepository().deleteList(id);
}

export class EntryNotFoundError extends Error {
  constructor(id: string) {
    super(`Library entry not found: ${id}`);
    this.name = "EntryNotFoundError";
  }
}

export class ListNotFoundError extends Error {
  constructor(id: string) {
    super(`Custom list not found: ${id}`);
    this.name = "ListNotFoundError";
  }
}
