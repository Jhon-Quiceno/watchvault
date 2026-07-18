import { NextResponse } from "next/server";
import { z } from "zod";

import type { LibraryEntry } from "@/types/media";
import { DemoReadOnlyError } from "@/server/repositories/demo-error";
import { importEntries } from "@/server/library/library-service";

export const dynamic = "force-dynamic";

/** Minimal shape guard for a previously exported entry. */
const importedEntrySchema = z
  .object({
    id: z.string(),
    media: z.object({
      provider: z.enum(["tmdb", "anilist"]),
      providerId: z.string(),
      type: z.enum(["movie", "series", "anime"]),
      title: z.string(),
    }),
  })
  .passthrough();

const importSchema = z.object({ entries: z.array(importedEntrySchema) });

/** POST /api/library/import — bulk add entries from an exported vault file. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Unrecognized export file" }, { status: 400 });
  }

  try {
    const imported = await importEntries(parsed.data.entries as unknown as LibraryEntry[]);
    return NextResponse.json({ imported });
  } catch (error) {
    if (error instanceof DemoReadOnlyError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
