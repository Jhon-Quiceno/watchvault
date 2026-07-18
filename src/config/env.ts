import { z } from "zod";

/**
 * Server-only environment schema.
 *
 * These values must never be imported from a client component or exposed
 * through `NEXT_PUBLIC_*` variables. All external metadata providers
 * (TMDB, AniList) are consumed exclusively from server code.
 *
 * `NEXT_PUBLIC_DEMO_MODE` is the one exception: it's registered here for
 * schema consistency, but Next.js inlines `NEXT_PUBLIC_*` vars at build
 * time, so client components read `process.env.NEXT_PUBLIC_DEMO_MODE`
 * directly instead of going through `getEnv()`.
 */
const envSchema = z.object({
  TMDB_API_KEY: z.string().optional(),
  TMDB_API_BASE_URL: z.string().url().default("https://api.themoviedb.org/3"),
  ANILIST_GRAPHQL_URL: z.string().url().default("https://graphql.anilist.co"),
  DATABASE_URL: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  SITE_PASSWORD: z.string().optional(),
  NEXT_PUBLIC_DEMO_MODE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

/**
 * Lazily parses and caches process.env against the schema.
 *
 * Parsing is deferred (not run at module load time) so that builds and
 * tooling that don't need these variables never fail due to missing keys.
 */
export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse({
      TMDB_API_KEY: process.env.TMDB_API_KEY,
      TMDB_API_BASE_URL: process.env.TMDB_API_BASE_URL,
      ANILIST_GRAPHQL_URL: process.env.ANILIST_GRAPHQL_URL,
      DATABASE_URL: process.env.DATABASE_URL,
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
      SITE_PASSWORD: process.env.SITE_PASSWORD,
      NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    });
  }

  return cachedEnv;
}
