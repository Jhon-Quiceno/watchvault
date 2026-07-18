import demoSeed from "../../../data/demo-seed.json";

import type { CustomList, LibraryEntry } from "@/types/media";
import type { LibraryRepository } from "@/server/repositories/library-repository";
import { DemoReadOnlyError } from "@/server/repositories/demo-error";

interface LibraryStore {
  entries: LibraryEntry[];
  lists: CustomList[];
}

const seed = demoSeed as unknown as LibraryStore;

/**
 * Read-only `LibraryRepository` backed by the bundled `data/demo-seed.json`
 * snapshot. Used for the public demo deployment: reads return the seed
 * data as-is, and every write throws `DemoReadOnlyError` synchronously
 * before touching anything, so the seed can never be mutated.
 */
export class DemoLibraryRepository implements LibraryRepository {
  async getAllEntries(): Promise<LibraryEntry[]> {
    return seed.entries;
  }

  async getEntryById(id: string): Promise<LibraryEntry | null> {
    return seed.entries.find((entry) => entry.id === id) ?? null;
  }

  async createEntry(): Promise<LibraryEntry> {
    throw new DemoReadOnlyError();
  }

  async updateEntry(): Promise<LibraryEntry> {
    throw new DemoReadOnlyError();
  }

  async deleteEntry(): Promise<void> {
    throw new DemoReadOnlyError();
  }

  async getAllLists(): Promise<CustomList[]> {
    return seed.lists;
  }

  async getListById(id: string): Promise<CustomList | null> {
    return seed.lists.find((list) => list.id === id) ?? null;
  }

  async createList(): Promise<CustomList> {
    throw new DemoReadOnlyError();
  }

  async updateList(): Promise<CustomList> {
    throw new DemoReadOnlyError();
  }

  async deleteList(): Promise<void> {
    throw new DemoReadOnlyError();
  }
}
