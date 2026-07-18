import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProfileState {
  name: string;
  bio: string;
  avatarUrl: string | null;
  setProfile: (profile: Partial<Pick<ProfileState, "name" | "bio" | "avatarUrl">>) => void;
}

/**
 * The personal profile lives entirely client-side for now — it's identity,
 * not library data — persisted to localStorage. A future multi-user backend
 * would move this server-side without touching the consuming components.
 */
export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      name: "Yo",
      bio: "",
      avatarUrl: null,
      setProfile: (profile) => set(profile),
    }),
    { name: "watchvault:profile" },
  ),
);
