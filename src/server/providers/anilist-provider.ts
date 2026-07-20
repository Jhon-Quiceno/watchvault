import axios from "axios";

import type {
  CastMember,
  EpisodeInfo,
  MediaDetails,
  MediaSearchResult,
  MediaType,
  NextEpisode,
  SimilarMediaSummary,
} from "@/types/media";
import { getEnv } from "@/config/env";
import { stripHtml } from "@/lib/format";
import type {
  MetadataProvider,
  MetadataSearchOptions,
} from "@/server/providers/provider.interface";

interface AniListMedia {
  id: number;
  title: { romaji: string | null; english: string | null; native: string | null };
  description: string | null;
  coverImage: { extraLarge: string | null; large: string | null } | null;
  bannerImage: string | null;
  startDate: { year: number | null } | null;
  startDateRaw?: { year: number | null; month: number | null; day: number | null } | null;
  averageScore: number | null;
  genres: string[] | null;
  episodes: number | null;
  duration: number | null;
  status: string | null;
  studios: { nodes: { name: string; isAnimationStudio: boolean }[] } | null;
  trailer: { id: string | null; site: string | null } | null;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  characters: {
    nodes: { name: { full: string | null } | null; image: { medium: string | null } | null }[];
  } | null;
  recommendations: {
    nodes: { mediaRecommendation: Pick<AniListMedia, "id" | "title" | "coverImage"> | null }[];
  } | null;
  streamingEpisodes: { title: string | null }[] | null;
}

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  description
  coverImage { extraLarge large }
  bannerImage
  startDate { year }
  averageScore
  genres
  episodes
  duration
  status
`;

const DETAIL_FIELDS = `
  ${MEDIA_FIELDS}
  studios { nodes { name isAnimationStudio } }
  trailer { id site }
  nextAiringEpisode { episode airingAt }
  characters(sort: ROLE, perPage: 12) { nodes { name { full } image { medium } } }
  recommendations(sort: RATING_DESC, perPage: 12) {
    nodes { mediaRecommendation { id title { romaji english } coverImage { large } } }
  }
  streamingEpisodes { title }
`;

const SEARCH_QUERY = `
  query ($search: String, $page: Int) {
    Page(page: $page, perPage: 20) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const DETAILS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      ${DETAIL_FIELDS}
    }
  }
`;

function pickTitle(title: AniListMedia["title"]): string {
  return title.english ?? title.romaji ?? title.native ?? "Untitled";
}

function toSearchResult(media: AniListMedia): MediaSearchResult {
  return {
    id: `anilist:anime:${media.id}`,
    provider: "anilist",
    providerId: String(media.id),
    type: "anime",
    title: pickTitle(media.title),
    originalTitle: media.title.native ?? media.title.romaji ?? "",
    year: media.startDate?.year ?? null,
    posterUrl: media.coverImage?.extraLarge ?? media.coverImage?.large ?? null,
    backdropUrl: media.bannerImage,
    overview: media.description ? stripHtml(media.description) : "",
    rating: media.averageScore ? Number((media.averageScore / 10).toFixed(1)) : null,
  };
}

function mapNextEpisode(next: AniListMedia["nextAiringEpisode"]): NextEpisode | undefined {
  if (!next) return undefined;
  return {
    season: 1,
    episode: next.episode,
    airDate: new Date(next.airingAt * 1000).toISOString(),
    name: null,
  };
}

function mapCast(characters: AniListMedia["characters"]): CastMember[] {
  return (characters?.nodes ?? []).map((node) => ({
    name: node.name?.full ?? "Unknown",
    character: "",
    profileUrl: node.image?.medium ?? null,
  }));
}

function mapEpisodes(media: AniListMedia): EpisodeInfo[] {
  const streaming = media.streamingEpisodes ?? [];
  const total = media.episodes ?? streaming.length;
  return Array.from({ length: total }, (_, index) => {
    const episodeNumber = index + 1;
    return {
      episodeNumber,
      name: streaming[index]?.title ?? `Episodio ${episodeNumber}`,
      airDate: null,
    };
  });
}

function mapSimilar(recommendations: AniListMedia["recommendations"]): SimilarMediaSummary[] {
  return (recommendations?.nodes ?? [])
    .map((node) => node.mediaRecommendation)
    .filter((media): media is NonNullable<typeof media> => media !== null)
    .map((media) => ({
      id: `anilist:anime:${media.id}`,
      title: pickTitle(media.title),
      posterUrl: media.coverImage?.large ?? null,
    }));
}

/**
 * AniList adapter. Covers anime through the AniList GraphQL API, mapping its
 * schema onto Watchvault's domain model. Server-side only.
 */
export class AniListProvider implements MetadataProvider {
  readonly id = "anilist" as const;
  readonly supports: MediaType[] = ["anime"];

  private async request<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const env = getEnv();
    const { data } = await axios.post<{ data: T; errors?: { message: string }[] }>(
      env.ANILIST_GRAPHQL_URL,
      { query, variables },
      { headers: { "Content-Type": "application/json" }, timeout: 10_000 },
    );
    if (data.errors?.length) {
      throw new Error(`AniList error: ${data.errors[0]?.message ?? "unknown"}`);
    }
    return data.data;
  }

  async search(query: string, opts?: MetadataSearchOptions): Promise<MediaSearchResult[]> {
    if (!query.trim()) return [];
    const data = await this.request<{ Page: { media: AniListMedia[] } }>(SEARCH_QUERY, {
      search: query,
      page: opts?.page ?? 1,
    });
    return data.Page.media.map(toSearchResult);
  }

  async getDetails(providerId: string): Promise<MediaDetails> {
    const data = await this.request<{ Media: AniListMedia }>(DETAILS_QUERY, {
      id: Number.parseInt(providerId, 10),
    });
    const media = data.Media;
    const base = toSearchResult(media);
    const animationStudio =
      media.studios?.nodes.find((studio) => studio.isAnimationStudio) ?? media.studios?.nodes[0];

    return {
      ...base,
      genres: media.genres ?? [],
      runtimeMinutes: media.duration ?? null,
      releaseDate: media.startDate?.year ? `${media.startDate.year}-01-01` : null,
      status: media.status ?? "",
      productionCompanies: (media.studios?.nodes ?? []).map((studio) => studio.name),
      director: animationStudio?.name ?? null,
      cast: mapCast(media.characters),
      seasonCount: null,
      episodeCount: media.episodes ?? null,
      nextEpisode: mapNextEpisode(media.nextAiringEpisode),
      trailerUrl:
        media.trailer?.site === "youtube" && media.trailer.id
          ? `https://www.youtube.com/watch?v=${media.trailer.id}`
          : null,
      watchProviders: undefined,
      collections: undefined,
      similar: mapSimilar(media.recommendations),
      episodes: mapEpisodes(media),
    };
  }
}

export const anilistProvider = new AniListProvider();
