import { BlobPreconditionFailedError, get, put } from "@vercel/blob";

import type { CustomList, LibraryEntry } from "@/types/media";
import type { LibraryRepository } from "@/server/repositories/library-repository";

interface LibraryStore {
  entries: LibraryEntry[];
  lists: CustomList[];
}

const BLOB_PATHNAME = "library.json";
const MAX_WRITE_RETRIES = 8;

interface StoreSnapshot {
  store: LibraryStore;
  etag: string | null;
}

/**
 * Vercel Blob-based `LibraryRepository` implementation. Serverless
 * functions have an ephemeral filesystem, so the whole library is kept as
 * a single JSON blob instead of a local file. Same store shape, same
 * public contract as `JsonLibraryRepository`.
 */
export class BlobLibraryRepository implements LibraryRepository {
  private async readSnapshot(): Promise<StoreSnapshot> {
    const result = await get(BLOB_PATHNAME, {
      access: "private",
      useCache: false,
    });

    if (!result || result.stream === null) {
      return { store: { entries: [], lists: [] }, etag: null };
    }

    const raw = await new Response(result.stream).text();
    return { store: JSON.parse(raw) as LibraryStore, etag: result.blob.etag };
  }

  /**
   * Bulk actions fire multiple parallel PATCH requests, and every write
   * here is a full read-modify-write of the same blob. Without a
   * conditional write, concurrent invocations would silently clobber each
   * other (lost updates). `put` is called with `ifMatch` against the ETag
   * we just read; if another write raced us, the SDK throws
   * `BlobPreconditionFailedError` and we re-read the fresh state and
   * re-apply the mutation instead of retrying blindly against stale data.
   */
  private async writeWithRetry<T>(
    mutate: (store: LibraryStore) => T,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt++) {
      const { store, etag } = await this.readSnapshot();
      const result = mutate(store);

      // TEMPORARY diagnostic logging while investigating a persistent
      // precondition-failure bug — remove once root-caused.
      console.log(
        `[blob-repo] attempt=${attempt} readEtag=${etag} entries=${store.entries.length}`,
      );

      try {
        await put(BLOB_PATHNAME, JSON.stringify(store), {
          access: "private",
          allowOverwrite: true,
          contentType: "application/json",
          ...(etag ? { ifMatch: etag } : {}),
        });
        return result;
      } catch (error) {
        if (error instanceof BlobPreconditionFailedError) {
          lastError = error;
          console.log(
            `[blob-repo] precondition failed attempt=${attempt} sentEtag=${etag} message=${error.message}`,
          );
          await sleep(25 + Math.random() * 50);
          continue;
        }
        throw error;
      }
    }

    throw new Error(
      `Failed to write library blob after ${MAX_WRITE_RETRIES} attempts due to concurrent writes: ${String(lastError)}`,
    );
  }

  async getAllEntries(): Promise<LibraryEntry[]> {
    const { store } = await this.readSnapshot();
    return store.entries;
  }

  async getEntryById(id: string): Promise<LibraryEntry | null> {
    const { store } = await this.readSnapshot();
    return store.entries.find((entry) => entry.id === id) ?? null;
  }

  async createEntry(entry: LibraryEntry): Promise<LibraryEntry> {
    return this.writeWithRetry((store) => {
      store.entries.push(entry);
      return entry;
    });
  }

  async updateEntry(id: string, entry: LibraryEntry): Promise<LibraryEntry> {
    return this.writeWithRetry((store) => {
      const index = store.entries.findIndex((existing) => existing.id === id);
      if (index === -1) {
        throw new Error(`Library entry not found: ${id}`);
      }
      store.entries[index] = entry;
      return entry;
    });
  }

  async deleteEntry(id: string): Promise<void> {
    await this.writeWithRetry((store) => {
      store.entries = store.entries.filter((entry) => entry.id !== id);
    });
  }

  async getAllLists(): Promise<CustomList[]> {
    const { store } = await this.readSnapshot();
    return store.lists;
  }

  async getListById(id: string): Promise<CustomList | null> {
    const { store } = await this.readSnapshot();
    return store.lists.find((list) => list.id === id) ?? null;
  }

  async createList(list: CustomList): Promise<CustomList> {
    return this.writeWithRetry((store) => {
      store.lists.push(list);
      return list;
    });
  }

  async updateList(id: string, list: CustomList): Promise<CustomList> {
    return this.writeWithRetry((store) => {
      const index = store.lists.findIndex((existing) => existing.id === id);
      if (index === -1) {
        throw new Error(`Custom list not found: ${id}`);
      }
      store.lists[index] = list;
      return list;
    });
  }

  async deleteList(id: string): Promise<void> {
    await this.writeWithRetry((store) => {
      store.lists = store.lists.filter((list) => list.id !== id);
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
