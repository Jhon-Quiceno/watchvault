import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { MediaType, WatchStatus } from "@/types/media";

export type LibrarySort = "recent" | "title" | "rating" | "year";

interface LibraryFiltersState {
  query: string;
  status: WatchStatus | "all";
  type: MediaType | "all";
  tag: string | null;
  favoritesOnly: boolean;
  sort: LibrarySort;
  setQuery: (query: string) => void;
  setStatus: (status: WatchStatus | "all") => void;
  setType: (type: MediaType | "all") => void;
  setTag: (tag: string | null) => void;
  toggleFavoritesOnly: () => void;
  setSort: (sort: LibrarySort) => void;
  reset: () => void;
}

const DEFAULTS = {
  query: "",
  status: "all" as const,
  type: "all" as const,
  tag: null,
  favoritesOnly: false,
  sort: "recent" as LibrarySort,
};

/**
 * Library filter state. Persisted so a chosen view survives reloads, as the
 * brief calls for. The free-text `query` is intentionally not persisted — it
 * should start empty each visit.
 */
export const useLibraryFilters = create<LibraryFiltersState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setQuery: (query) => set({ query }),
      setStatus: (status) => set({ status }),
      setType: (type) => set({ type }),
      setTag: (tag) => set({ tag }),
      toggleFavoritesOnly: () => set((state) => ({ favoritesOnly: !state.favoritesOnly })),
      setSort: (sort) => set({ sort }),
      reset: () => set(DEFAULTS),
    }),
    {
      name: "watchvault:library-filters",
      partialize: ({ status, type, tag, favoritesOnly, sort }) => ({
        status,
        type,
        tag,
        favoritesOnly,
        sort,
      }),
    },
  ),
);
