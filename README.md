# Pépite

A TikTok-style vertical feed where every "video" is a gem extracted from a high-quality English Wikipedia article. Hook first, story after — learning that feels like a social feed.

## Setup

```bash
npm install
npm run dev
```

No config, no API key. The app talks only to the public English Wikipedia APIs (`/w/api.php` and `/api/rest_v1`). `npm run build` produces a static bundle in `dist/`, `npm run preview` serves it, `npm run check` runs svelte-check.

## Architecture

```
src/
  lib/
    wiki.ts      Wikipedia client (extracts, featured feed, on-this-day,
                 geosearch) with in-memory + localStorage caching (TTL),
                 retry with backoff, and stale-cache fallback on failure.
    gem.ts       The gem pipeline: cleans the extract (headings, references,
                 parentheticals, bibliography junk), scores every sentence
                 for surprise (years, numbers, superlatives, striking words,
                 curiosity markers; definition sentences and technical junk
                 are penalized), picks the hook, and — when it makes the
                 hook stronger — truncates it at a clause boundary to create
                 a curiosity gap (the removed clause becomes the reveal on
                 the next screen). The rest is chunked into 3-6 story
                 screens ending on the highest-scoring remaining "twist"
                 sentence; some gems get a bonus "Wait, what?" fact.
    pool.ts      Topic seed lists (7 topics) and a hand-curated pool of
                 verified gems used for the deterministic Gem of the day
                 and as an offline/API-failure fallback.
    feed.ts      Feed engine: per-mode candidate suppliers, quality
                 filtering, seen-dedup, and queue top-up so the current
                 gem plus the next 3 are always ready (images preloaded).
    storage.ts   localStorage only: likes, history, seen ids, daily streak,
                 weekly counter, settings. Nothing leaves the device.
    share.ts     Canvas-rendered shareable card (title + hook + image),
                 shared via the Web Share API with clipboard fallback.
    sound.ts     Optional Web Audio tick/pop + haptics. Off by default.
  components/
    Feed.svelte  Swipe physics (touch drag with velocity + resistance,
                 wheel, keyboard), double-tap like with heart burst,
                 progress bar, preloading.
    GemCard.svelte  Hook / story / payoff screens, Ken Burns background,
                 rare-frame for the Gem of the day.
    ModeSwitcher / StatsSheet / ProgressBar / Toasts / Skeleton
```

## Discovery modes

- **Gem of the day** — deterministic by date, curated, visually rare.
- **On this day** — Wikipedia's "selected" events for today's date.
- **Topics** — science, history, crime & mysteries, space, nature, arts, tech.
- **Near me** — geosearch around your location (permission asked only when the mode opens).

## Privacy

No account, no analytics, no trackers. Likes, history, streak and settings live in `localStorage`; the only network traffic is read-only Wikipedia API calls.

## Next steps

- Topic classification via article categories instead of keyword guessing.
- Background image fetch fallback (search for a lead image when `pageimages` returns none).
- PWA support (offline fallback pool already works).
- Optional on-device scoring calibration from like/skip signals.
