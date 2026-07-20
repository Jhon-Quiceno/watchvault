import { z } from "zod";

/**
 * Pure (server-agnostic) validation schemas shared by the API route handlers
 * and the client-side forms, so both ends agree on the exact shape.
 */

export const mediaTypeSchema = z.enum(["movie", "series", "anime"]);
export const providerIdSchema = z.enum(["tmdb", "anilist"]);
export const watchStatusSchema = z.enum([
  "watching",
  "completed",
  "plan_to_watch",
  "on_hold",
]);

/** The client adds a title by reference; the server fetches the snapshot. */
export const addToLibrarySchema = z.object({
  provider: providerIdSchema,
  providerId: z.string().min(1),
  type: mediaTypeSchema,
  status: watchStatusSchema.default("plan_to_watch"),
});
export type AddToLibraryInput = z.infer<typeof addToLibrarySchema>;

export const entryProgressSchema = z.object({
  watchedEpisodes: z.number().int().min(0),
  watchedSeasons: z.number().int().min(0),
  watchedEpisodeKeys: z.array(z.string()),
  completedSeasons: z.array(z.number().int()),
});

export const updateEntrySchema = z
  .object({
    status: watchStatusSchema,
    personalRating: z.number().min(0).max(10).nullable(),
    favorite: z.boolean(),
    notes: z.string().max(5000),
    tags: z.array(z.string().min(1).max(40)),
    startedAt: z.string().nullable(),
    finishedAt: z.string().nullable(),
    rewatchCount: z.number().int().min(0),
    progress: entryProgressSchema,
  })
  .partial();
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;

export const listInputSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).default(""),
  coverUrl: z.string().url().nullable().default(null),
  entryIds: z.array(z.string()).default([]),
});
export type ListInput = z.infer<typeof listInputSchema>;
