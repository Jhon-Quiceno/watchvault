import { NextResponse } from "next/server";

import { mediaTypeSchema } from "@/lib/schemas/library";
import { searchMetadata } from "@/server/providers/metadata-service";

export const dynamic = "force-dynamic";

/** GET /api/search?q=<query>&type=<movie|series|anime> */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const typeParam = searchParams.get("type");
  const typeResult = typeParam ? mediaTypeSchema.safeParse(typeParam) : null;
  const type = typeResult?.success ? typeResult.data : undefined;

  try {
    const results = await searchMetadata(query, type);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("search failed", error);
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }
}
