import { NextResponse } from "next/server";

import { addToLibrarySchema } from "@/lib/schemas/library";
import { DemoReadOnlyError } from "@/server/repositories/demo-error";
import { addEntry, listEntries } from "@/server/library/library-service";

export const dynamic = "force-dynamic";

/** GET /api/library — all library entries, newest activity first. */
export async function GET() {
  const entries = await listEntries();
  return NextResponse.json({ entries });
}

/** POST /api/library — add a title by provider reference. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = addToLibrarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const entry = await addEntry(parsed.data);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    if (error instanceof DemoReadOnlyError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("add entry failed", error);
    return NextResponse.json({ error: "Could not add title" }, { status: 502 });
  }
}
