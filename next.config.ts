import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "s4.anilist.co" },
      // AniList's streamingEpisodes thumbnails are served from Crunchyroll's CDN.
      { protocol: "https", hostname: "*.ak.crunchyroll.com" },
    ],
  },
};

export default nextConfig;
