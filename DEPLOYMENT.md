# Deploying Watchvault

This guide takes you from a fresh clone to a live app on Vercel. It assumes the code is already pushed to GitHub at [`Jhon-Quiceno/watchvault`](https://github.com/Jhon-Quiceno/watchvault).

## 1. Get a TMDB API key

Movies and series search runs through TMDB — you need a free key.

1. Create an account at [themoviedb.org](https://www.themoviedb.org/signup).
2. Go to **Settings → API** → request an API key (choose "Developer", the free tier is enough).
3. Copy the **API Read Access Token** or the **API Key (v3 auth)** — this app uses the v3 key (`TMDB_API_KEY`).

Anime search via AniList needs no key — skip straight to step 2 if you only care about anime.

## 2. Import the project into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Select the `watchvault` repository and click **Import**.
3. Framework preset should auto-detect as **Next.js** — leave build settings as default (`pnpm build`, `pnpm install`).
4. **Don't deploy yet** — first add the environment variable below, or add it and redeploy after. Either order works.

### Environment variables to set in Vercel

In the project's **Settings → Environment Variables**, add:

| Name | Value | Environments |
|---|---|---|
| `TMDB_API_KEY` | the key from step 1 | Production, Preview, Development |

That's the only one you set manually. `BLOB_READ_WRITE_TOKEN` gets added automatically in the next step — don't create it yourself.

## 3. Create and connect a Vercel Blob store

This is what makes your library actually persist — without it, the app can't save anything in production.

1. In your Vercel dashboard, go to the **Storage** tab (either at the account level or inside the project).
2. Click **Create Database** → choose **Blob**.
3. Give it a name (e.g. `watchvault-library`), pick a region close to you, and create it.
4. On the connection screen, **connect it to your `watchvault` project**. Vercel automatically injects `BLOB_READ_WRITE_TOKEN` into that project's environment — you don't set this by hand.
5. If the project was already deployed before you connected the store, trigger a redeploy (**Deployments → ⋯ → Redeploy** on the latest one) so the new env var is picked up.

## 4. Deploy

If you haven't yet, click **Deploy**. Vercel builds and gives you a live URL (`watchvault-xxxx.vercel.app`, or your own domain if you attach one later).

Open it, search for a title, and add it — if it shows up after a page refresh, persistence is working end to end.

## 5. Local development after this point

Local dev never needs `BLOB_READ_WRITE_TOKEN` — without it, the app automatically falls back to a local `data/library.json` file, so `pnpm dev` keeps working exactly as before with zero setup.

If you ever want to point your local machine at the *real* production data in Blob (careful — you'd be reading/writing live data):

```bash
vercel link        # link this folder to the Vercel project, once
vercel env pull     # pulls BLOB_READ_WRITE_TOKEN (and others) into .env.local
```

## Troubleshooting

- **Search returns nothing for movies/series but anime works**: `TMDB_API_KEY` is missing or wrong in Vercel's env vars. AniList needs no key, so it working alone is expected in that case.
- **Added titles disappear after a while / on redeploy**: the Blob store isn't connected, or `BLOB_READ_WRITE_TOKEN` wasn't picked up — redeploy after connecting the store (step 3.5).
- **Build fails on Vercel but works locally**: check the build logs for a missing env var first — `pnpm build` locally doesn't require `TMDB_API_KEY`/`BLOB_READ_WRITE_TOKEN` to succeed (both are read lazily at request time), so a passing local build doesn't guarantee env vars are correctly set in Vercel.
