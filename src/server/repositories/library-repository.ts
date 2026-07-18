import type { CustomList, LibraryEntry } from "@/types/media";

/**
 * Persistence contract for the user's library. Implementations are free to
 * back this with a JSON file (current), a database (future), etc. Nothing
 * outside this folder should depend on the storage mechanism.
 */
export interface LibraryRepository {
  getAllEntries(): Promise<LibraryEntry[]>;
  getEntryById(id: string): Promise<LibraryEntry | null>;
  createEntry(entry: LibraryEntry): Promise<LibraryEntry>;
  updateEntry(id: string, entry: LibraryEntry): Promise<LibraryEntry>;
  deleteEntry(id: string): Promise<void>;

  getAllLists(): Promise<CustomList[]>;
  getListById(id: string): Promise<CustomList | null>;
  createList(list: CustomList): Promise<CustomList>;
  updateList(id: string, list: CustomList): Promise<CustomList>;
  deleteList(id: string): Promise<void>;
}
