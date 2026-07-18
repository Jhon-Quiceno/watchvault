import { NextResponse } from "next/server";

import { listInputSchema } from "@/lib/schemas/library";
import {
  ListNotFoundError,
  removeList,
  updateList,
} from "@/server/library/library-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** PUT /api/lists/:id — replace a custom list's editable fields. */
export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = listInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const list = await updateList(id, parsed.data);
    return NextResponse.json({ list });
  } catch (error) {
    if (error instanceof ListNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw error;
  }
}

/** DELETE /api/lists/:id */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await removeList(id);
  return new NextResponse(null, { status: 204 });
}
