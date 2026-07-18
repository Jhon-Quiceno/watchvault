import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CustomList, LibraryEntry } from "@/types/media";
import type { LibraryRepository } from "@/server/repositories/library-repository";

interface LibraryStore {
  entries: LibraryEntry[];
  lists: CustomList[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "library.json");

/**
 * File-based `LibraryRepository` implementation. This is a placeholder
 * persistence layer until a PostgreSQL-backed repository replaces it; the
 * public contract is identical either way.
 */
export class JsonLibraryRepository implements LibraryRepository {
  private async readStore(): Promise<LibraryStore> {
    try {
      const raw = await readFile(DATA_FILE, "utf-8");
      return JSON.parse(raw) as LibraryStore;
    } catch (error) {
      if (isNotFoundError(error)) {
        return { entries: [], lists: [] };
      }
      throw error;
    }
  }

  private async writeStore(store: LibraryStore): Promise<void> {
    await mkdir(DATA_DIR, { recursive: true });
    const tempFile = path.join(DATA_DIR, `library.${randomUUID()}.tmp.json`);
    await writeFile(tempFile, JSON.stringify(store, null, 2), "utf-8");
    await rename(tempFile, DATA_FILE);
  }

  async getAllEntries(): Promise<LibraryEntry[]> {
    const store = await this.readStore();
    return store.entries;
  }

  async getEntryById(id: string): Promise<LibraryEntry | null> {
    const store = await this.readStore();
    return store.entries.find((entry) => entry.id === id) ?? null;
  }

  async createEntry(entry: LibraryEntry): Promise<LibraryEntry> {
    const store = await this.readStore();
    store.entries.push(entry);
    await this.writeStore(store);
    return entry;
  }

  async updateEntry(id: string, entry: LibraryEntry): Promise<LibraryEntry> {
    const store = await this.readStore();
    const index = store.entries.findIndex((existing) => existing.id === id);
    if (index === -1) {
      throw new Error(`Library entry not found: ${id}`);
    }
    store.entries[index] = entry;
    await this.writeStore(store);
    return entry;
  }

  async deleteEntry(id: string): Promise<void> {
    const store = await this.readStore();
    store.entries = store.entries.filter((entry) => entry.id !== id);
    await this.writeStore(store);
  }

  async getAllLists(): Promise<CustomList[]> {
    const store = await this.readStore();
    return store.lists;
  }

  async getListById(id: string): Promise<CustomList | null> {
    const store = await this.readStore();
    return store.lists.find((list) => list.id === id) ?? null;
  }

  async createList(list: CustomList): Promise<CustomList> {
    const store = await this.readStore();
    store.lists.push(list);
    await this.writeStore(store);
    return list;
  }

  async updateList(id: string, list: CustomList): Promise<CustomList> {
    const store = await this.readStore();
    const index = store.lists.findIndex((existing) => existing.id === id);
    if (index === -1) {
      throw new Error(`Custom list not found: ${id}`);
    }
    store.lists[index] = list;
    await this.writeStore(store);
    return list;
  }

  async deleteList(id: string): Promise<void> {
    const store = await this.readStore();
    store.lists = store.lists.filter((list) => list.id !== id);
    await this.writeStore(store);
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "ENOENT"
  );
}
