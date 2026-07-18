<p align="center">
  <img src="./public/logo.svg" alt="Watchvault logo" width="88" height="88" />
</p>

<h1 align="center">Watchvault</h1>

<p align="center"><strong>Your entire watch history — movies, series, and anime — in one fast, personal vault.</strong></p>

Watchvault is a self-hosted tracker for everything you watch. Search TMDB and AniList, preview full details before committing to anything, log it with the right status in one move, and let your dashboard, stats, and recommendations take it from there. No accounts, no social feed, no noise — just your library, built for speed.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

<!--
  Add real screenshots/GIFs here once deployed — dashboard, search + detail
  view, and the library grid are the three most visual surfaces.
  ![Dashboard](./docs/screenshots/dashboard.png)
-->

---

## ✨ Features

### Discover without commitment
- **Unified search** across **TMDB** (movies & series) and **AniList** (anime), grouped and filterable by type, with results streaming in as you type.
- **Full detail preview before adding** — poster, synopsis, cast, genres, runtime, trailer, and where to stream it. You decide with real information, not just a thumbnail.
- **Add with the right status in one click** — pick *Viendo*, *Completado*, *Por ver*, *En pausa*, *Abandonado* or *Reviendo* right from the search result or the detail dialog; it's saved exactly as you tell it, no edit-after-adding step.
- **Duplicate detection** — titles already in your vault are clearly marked wherever they show up in search, so you never add the same thing twice.
- **"Where to watch"** — streaming availability pulled straight from the provider data, shown right in the detail view.

### Stay on top of what you're watching
- **Dashboard** with smart shelves (*Continúa viendo*, *Agregados recientemente*, *Favoritos*, *Por ver*) and at-a-glance stats (titles tracked, hours watched, average rating, favorites).
- **Próximos episodios** — a live widget that fetches fresh episode data for everything you're actively watching and tells you what's airing today, tomorrow, or dropped in the last few days, so nothing slips by.

### Organize your way
- **Full library management** — status, personal rating, favorites, notes, tags, start/finish dates, watched episodes/seasons, rewatch count.
- **Bulk actions** — multi-select entries to change status or remove several titles at once, with confirmation before anything destructive.
- **Custom lists** to group titles however makes sense to you.
- **Powerful filters and sorting** across the whole library.
- **Import/export** your library as JSON — your data is always portable.

### Understand your habits
- **Stats page** with an activity heatmap and breakdowns by type, status, and rating.
- **Recommendations** generated locally from your own taste — no external recommendation API, no data leaving your vault.

### Built to feel native
- **Command palette** (`⌘K` / `Ctrl+K`) to jump anywhere instantly.
- **Dark / light theme**, fully responsive from phone to ultrawide — a proper mobile nav drawer, adaptive grids, and touch-friendly controls throughout.

---

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) — App Router, TypeScript, Turbopack |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (built on [Base UI](https://base-ui.com)) |
| Server state | [TanStack Query](https://tanstack.com/query) |
| Client state | [Zustand](https://zustand-demo.pmnd.rs) |
| Forms & validation | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| HTTP | [Axios](https://axios-http.com) |
| Motion | [Framer Motion](https://www.framer.com/motion) |
| Metadata providers | [TMDB](https://www.themoviedb.org/documentation/api) (movies/series) · [AniList](https://anilist.gitbook.io/anilist-apiv2-docs/) (anime, GraphQL) |
| Persistence | [Vercel Blob](https://vercel.com/docs/vercel-blob) in production · local JSON file in development |

## 🏗️ Architecture

Watchvault is built around a few deliberate boundaries so it stays easy to extend:

```
src/
  app/                  Next.js App Router routes, layout, and providers
  components/ui/        shadcn/ui generated primitives
  components/shared/    Reusable components shared across features
  components/layout/    App shell (nav, header, mobile drawer)
  features/             One folder per feature area (library, search,
                         dashboard, stats, lists, profile, recommendations)
  server/providers/     TMDB / AniList adapters behind a common
                         `MetadataProvider` interface — adding a new
                         source means implementing one interface
  server/repositories/  Persistence behind a `LibraryRepository`
                         interface — swappable storage backend with
                         zero changes to the rest of the app
  lib/                  Cross-cutting utilities (API client, query client)
  hooks/                Shared React hooks
  stores/               Zustand stores
  types/                Domain types — the anti-corruption boundary that
                         normalizes TMDB/AniList data into one shape
  config/               Server-only configuration (env validation)
```

- **Provider abstraction**: every external metadata source implements the same `MetadataProvider` interface, so search results and details always come back in one normalized shape regardless of where they came from.
- **Repository abstraction**: the library is read/written through a `LibraryRepository` interface. Locally that's a flat JSON file; in production it's Vercel Blob with optimistic-concurrency writes. Swapping to a relational database later touches this one boundary, nothing else.

---

## 🚀 Getting started

This project uses **pnpm**.

```bash
pnpm install
cp .env.example .env.local   # then fill in TMDB_API_KEY
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Where | Purpose |
|---|---|---|---|
| `TMDB_API_KEY` | Yes | Local + Production | Powers movie/series search and details via TMDB. [Get a free key](https://www.themoviedb.org/settings/api). |
| `BLOB_READ_WRITE_TOKEN` | Production only | Vercel (auto-injected) | Lets the app read/write your library to Vercel Blob. Not needed locally — dev falls back to a local JSON file automatically. |
| `TMDB_API_BASE_URL` | No | — | Overrides the TMDB API base URL. Defaults to the official endpoint. |
| `ANILIST_GRAPHQL_URL` | No | — | Overrides the AniList GraphQL endpoint. Defaults to the official endpoint. |

Anime search via AniList needs no API key.

## 📜 Scripts

- `pnpm dev` — start the development server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — run a production build locally
- `pnpm lint` — run ESLint

## ☁️ Deploying

Watchvault is built to deploy straight to [Vercel](https://vercel.com). See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full step-by-step: pushing to GitHub, creating the Vercel Blob store, setting environment variables, and going live.

## 📄 License

[MIT](./LICENSE) — do what you want with it.
