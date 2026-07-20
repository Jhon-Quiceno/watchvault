import { NextResponse } from "next/server";
import { z } from "zod";

import { mediaTypeSchema, providerIdSchema } from "@/lib/schemas/library";
import { getSeasonEpisodes } from "@/server/providers/metadata-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ provider: string; type: string; id: string; seasonNumber: string }>;
};

const seasonNumberSchema = z.coerce.number().int().min(1);

/** GET /api/media/:provider/:type/:id/season/:seasonNumber — episode list for one season. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { provider, type, id, seasonNumber } = await params;

  const providerResult = providerIdSchema.safeParse(provider);
  const typeResult = mediaTypeSchema.safeParse(type);
  const seasonResult = seasonNumberSchema.safeParse(seasonNumber);
  if (!providerResult.success || !typeResult.success || !seasonResult.success || !id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const episodes = await getSeasonEpisodes(providerResult.data, id, seasonResult.data);
    return NextResponse.json({ episodes });
  } catch (error) {
    console.error("season episodes failed", error);
    return NextResponse.json({ error: "Could not load season episodes" }, { status: 502 });
  }
}
