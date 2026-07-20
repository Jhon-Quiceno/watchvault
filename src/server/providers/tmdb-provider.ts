import axios, { type AxiosInstance } from "axios";

import type {
  CastMember,
  EpisodeInfo,
  MediaCollection,
  MediaDetails,
  MediaSearchResult,
  MediaType,
  NextEpisode,
  SimilarMediaSummary,
  WatchProvider,
} from "@/types/media";
import { getEnv } from "@/config/env";
import type {
  MetadataProvider,
  MetadataSearchOptions,
} from "@/server/providers/provider.interface";

const IMAGE_BASE = "https://image.tmdb.org/t/p";
const POSTER_SIZE = "w500";
const BACKDROP_SIZE = "w1280";
const PROFILE_SIZE = "w185";
const LOGO_SIZE = "w92";
/** TMDB media_type values Watchvault understands (people are ignored). */
const TMDB_TO_MEDIA_TYPE: Record<string, MediaType> = { movie: "movie", tv: "series" };
const MEDIA_TYPE_TO_TMDB: Record<"movie" | "series", "movie" | "tv"> = {
  movie: "movie",
  series: "tv",
};

interface TmdbSearchItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview?: string;
  vote_average?: number;
}

function imageUrl(path: string | null, size: string): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

function yearFrom(date?: string): number | null {
  if (!date) return null;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

function toSearchResult(item: TmdbSearchItem, forcedType?: MediaType): MediaSearchResult {
  const type = forcedType ?? TMDB_TO_MEDIA_TYPE[item.media_type ?? ""] ?? "movie";
  const isMovie = type === "movie";
  return {
    id: `tmdb:${type}:${item.id}`,
    provider: "tmdb",
    providerId: String(item.id),
    type,
    title: (isMovie ? item.title : item.name) ?? item.original_title ?? item.original_name ?? "Untitled",
    originalTitle: (isMovie ? item.original_title : item.original_name) ?? "",
    year: yearFrom(isMovie ? item.release_date : item.first_air_date),
    posterUrl: imageUrl(item.poster_path, POSTER_SIZE),
    backdropUrl: imageUrl(item.backdrop_path, BACKDROP_SIZE),
    overview: item.overview ?? "",
    rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : null,
  };
}

/**
 * TMDB (The Movie Database) adapter. Covers movies and series through the v3
 * REST API, translating raw responses into Watchvault's domain model. Never
 * called from the browser — only from server-side route handlers.
 */
export class TmdbProvider implements MetadataProvider {
  readonly id = "tmdb" as const;
  readonly supports: MediaType[] = ["movie", "series"];

  private client(): AxiosInstance {
    const env = getEnv();
    if (!env.TMDB_API_KEY) {
      throw new Error("TMDB_API_KEY is not configured");
    }
    return axios.create({
      baseURL: env.TMDB_API_BASE_URL,
      params: { api_key: env.TMDB_API_KEY, language: "en-US" },
      timeout: 10_000,
    });
  }

  async search(query: string, opts?: MetadataSearchOptions): Promise<MediaSearchResult[]> {
    if (!query.trim()) return [];
    const page = opts?.page ?? 1;
    const client = this.client();

    if (opts?.type && (opts.type === "movie" || opts.type === "series")) {
      const endpoint = `/search/${MEDIA_TYPE_TO_TMDB[opts.type]}`;
      const { data } = await client.get<{ results: TmdbSearchItem[] }>(endpoint, {
        params: { query, page, include_adult: false },
      });
      return data.results.map((item) => toSearchResult(item, opts.type));
    }

    const { data } = await client.get<{ results: TmdbSearchItem[] }>("/search/multi", {
      params: { query, page, include_adult: false },
    });
    return data.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => toSearchResult(item));
  }

  async getDetails(providerId: string, type: MediaType): Promise<MediaDetails> {
    if (type === "anime") {
      throw new Error("TMDB does not provide anime details");
    }
    const tmdbType = MEDIA_TYPE_TO_TMDB[type];
    const client = this.client();
    const { data } = await client.get<TmdbDetailsResponse>(`/${tmdbType}/${providerId}`, {
      params: { append_to_response: "credits,videos,watch/providers,similar" },
    });

    const base = toSearchResult(
      {
        id: data.id,
        title: data.title,
        name: data.name,
        original_title: data.original_title,
        original_name: data.original_name,
        release_date: data.release_date,
        first_air_date: data.first_air_date,
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        overview: data.overview,
        vote_average: data.vote_average,
      },
      type,
    );

    return {
      ...base,
      genres: (data.genres ?? []).map((g) => g.name),
      runtimeMinutes: data.runtime ?? data.episode_run_time?.[0] ?? null,
      releaseDate: data.release_date ?? data.first_air_date ?? null,
      status: data.status ?? "",
      productionCompanies: (data.production_companies ?? []).map((c) => c.name),
      director: findDirector(data, type),
      cast: mapCast(data.credits?.cast ?? []),
      seasonCount: data.number_of_seasons ?? null,
      episodeCount: data.number_of_episodes ?? null,
      nextEpisode: mapNextEpisode(data.next_episode_to_air),
      trailerUrl: findTrailer(data.videos?.results ?? []),
      watchProviders: mapWatchProviders(data["watch/providers"]),
      collections: mapCollection(data.belongs_to_collection),
      similar: mapSimilar(data.similar?.results ?? [], type),
    };
  }

  async getSeasonEpisodes(providerId: string, seasonNumber: number): Promise<EpisodeInfo[]> {
    const client = this.client();
    const { data } = await client.get<TmdbSeasonResponse>(
      `/tv/${providerId}/season/${seasonNumber}`,
    );
    return (data.episodes ?? []).map((episode) => ({
      episodeNumber: episode.episode_number,
      name: episode.name,
      airDate: episode.air_date ?? null,
    }));
  }
}

interface TmdbSeasonResponse {
  season_number: number;
  episodes: {
    episode_number: number;
    name: string;
    air_date: string | null;
  }[];
}

interface TmdbDetailsResponse extends TmdbSearchItem {
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  status?: string;
  production_companies?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  created_by?: { name: string }[];
  belongs_to_collection?: { id: number; name: string; poster_path: string | null } | null;
  next_episode_to_air?: {
    season_number: number;
    episode_number: number;
    air_date: string | null;
    name: string | null;
  } | null;
  credits?: {
    cast?: { name: string; character?: string; profile_path: string | null }[];
    crew?: { name: string; job: string }[];
  };
  videos?: { results?: { site: string; type: string; key: string; official?: boolean }[] };
  "watch/providers"?: {
    results?: Record<string, TmdbWatchRegion>;
  };
  similar?: { results?: TmdbSearchItem[] };
}

interface TmdbWatchRegion {
  flatrate?: { provider_name: string; logo_path: string | null }[];
  rent?: { provider_name: string; logo_path: string | null }[];
  buy?: { provider_name: string; logo_path: string | null }[];
}

function findDirector(data: TmdbDetailsResponse, type: MediaType): string | null {
  if (type === "series") return data.created_by?.[0]?.name ?? null;
  return data.credits?.crew?.find((member) => member.job === "Director")?.name ?? null;
}

function mapCast(cast: NonNullable<TmdbDetailsResponse["credits"]>["cast"] = []): CastMember[] {
  return cast.slice(0, 12).map((member) => ({
    name: member.name,
    character: member.character ?? "",
    profileUrl: imageUrl(member.profile_path, PROFILE_SIZE),
  }));
}

function mapNextEpisode(next: TmdbDetailsResponse["next_episode_to_air"]): NextEpisode | undefined {
  if (!next) return undefined;
  return {
    season: next.season_number,
    episode: next.episode_number,
    airDate: next.air_date,
    name: next.name,
  };
}

function findTrailer(
  videos: NonNullable<TmdbDetailsResponse["videos"]>["results"] = [],
): string | null {
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer");
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

function mapWatchProviders(
  data: TmdbDetailsResponse["watch/providers"],
): WatchProvider[] | undefined {
  const region = data?.results?.US ?? Object.values(data?.results ?? {})[0];
  if (!region) return undefined;
  const collect = (list: { provider_name: string; logo_path: string | null }[] | undefined, kind: WatchProvider["type"]) =>
    (list ?? []).map((p) => ({
      name: p.provider_name,
      logoUrl: imageUrl(p.logo_path, LOGO_SIZE),
      type: kind,
    }));
  const providers = [
    ...collect(region.flatrate, "stream"),
    ...collect(region.rent, "rent"),
    ...collect(region.buy, "buy"),
  ];
  return providers.length ? providers : undefined;
}

function mapCollection(
  collection: TmdbDetailsResponse["belongs_to_collection"],
): MediaCollection[] | undefined {
  if (!collection) return undefined;
  return [
    {
      id: String(collection.id),
      name: collection.name,
      posterUrl: imageUrl(collection.poster_path, POSTER_SIZE),
    },
  ];
}

function mapSimilar(items: TmdbSearchItem[], type: MediaType): SimilarMediaSummary[] {
  return items.slice(0, 12).map((item) => {
    const mapped = toSearchResult(item, type);
    return { id: mapped.id, title: mapped.title, posterUrl: mapped.posterUrl };
  });
}

export const tmdbProvider = new TmdbProvider();
