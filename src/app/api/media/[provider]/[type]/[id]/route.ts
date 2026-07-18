import { NextResponse } from "next/server";

import { mediaTypeSchema, providerIdSchema } from "@/lib/schemas/library";
import { getMediaDetails } from "@/server/providers/metadata-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ provider: string; type: string; id: string }>;
};

/** GET /api/media/:provider/:type/:id — full metadata for a single title. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { provider, type, id } = await params;

  const providerResult = providerIdSchema.safeParse(provider);
  const typeResult = mediaTypeSchema.safeParse(type);
  if (!providerResult.success || !typeResult.success || !id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const media = await getMediaDetails(providerResult.data, id, typeResult.data);
    return NextResponse.json({ media });
  } catch (error) {
    console.error("media details failed", error);
    return NextResponse.json({ error: "Could not load details" }, { status: 502 });
  }
}
