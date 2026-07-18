import axios from "axios";

/**
 * Axios instance for calling Watchvault's own `/api` route handlers from
 * client components. External providers (TMDB, AniList) are never called
 * directly from the browser — only through these internal routes.
 */
export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});
