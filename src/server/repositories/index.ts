import type { LibraryRepository } from "@/server/repositories/library-repository";
import { BlobLibraryRepository } from "@/server/repositories/blob-library-repository";
import { DemoLibraryRepository } from "@/server/repositories/demo-library-repository";
import { JsonLibraryRepository } from "@/server/repositories/json-library-repository";

let repository: LibraryRepository | undefined;

/**
 * Single place to swap the persistence backend. `NEXT_PUBLIC_DEMO_MODE`
 * takes priority over everything else — the public demo deployment always
 * serves the bundled seed data and rejects writes, regardless of whether a
 * Blob token happens to be configured. Otherwise, Vercel's serverless
 * functions have an ephemeral filesystem, so deployments (which have
 * `BLOB_READ_WRITE_TOKEN` injected once a Blob store is connected) use the
 * Vercel Blob-backed implementation; local dev without that token keeps
 * using the JSON file implementation unchanged.
 */
export function getLibraryRepository(): LibraryRepository {
  if (!repository) {
    repository =
      process.env.NEXT_PUBLIC_DEMO_MODE === "true"
        ? new DemoLibraryRepository()
        : process.env.BLOB_READ_WRITE_TOKEN
          ? new BlobLibraryRepository()
          : new JsonLibraryRepository();
  }
  return repository;
}
