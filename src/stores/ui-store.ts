import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  /** Whether the sidebar is collapsed to its icon-only rail (desktop). */
  sidebarCollapsed: boolean;
  /** Whether the mobile sidebar drawer is open. */
  mobileNavOpen: boolean;
  /** Whether the Ctrl+K command palette is open. */
  commandOpen: boolean;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
}

/**
 * Client-side UI shell state. Only the collapse preference is persisted; the
 * transient open/close flags reset on reload so the app never boots with a
 * stray dialog or drawer open.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      commandOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
    }),
    {
      name: "watchvault:ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
