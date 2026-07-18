import { NextResponse } from "next/server";

import { listInputSchema } from "@/lib/schemas/library";
import { DemoReadOnlyError } from "@/server/repositories/demo-error";
import { createList, listCustomLists } from "@/server/library/library-service";

export const dynamic = "force-dynamic";

/** GET /api/lists — all custom lists. */
export async function GET() {
  const lists = await listCustomLists();
  return NextResponse.json({ lists });
}

/** POST /api/lists — create a custom list. */
export async function POST(request: Request) {
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
    const list = await createList(parsed.data);
    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    if (error instanceof DemoReadOnlyError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
