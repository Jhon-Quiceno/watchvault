import { NextResponse } from "next/server";

import { updateEntrySchema } from "@/lib/schemas/library";
import {
  EntryNotFoundError,
  getEntry,
  removeEntry,
  updateEntry,
} from "@/server/library/library-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/library/:id */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ entry });
}

/** PATCH /api/library/:id — update the user's fields on an entry. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const entry = await updateEntry(id, parsed.data);
    return NextResponse.json({ entry });
  } catch (error) {
    if (error instanceof EntryNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw error;
  }
}

/** DELETE /api/library/:id */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await removeEntry(id);
  return new NextResponse(null, { status: 204 });
}
