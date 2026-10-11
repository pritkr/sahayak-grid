# 🌾 Sahayak Grid — offline-first civic PWA kit (Hindi-first)

> Astro PWA + Hono edge API + Postgres. Bihar's 8 flagship schemes, searchable in
> Hindi or Roman Hindi, fully usable with zero connectivity.

## Problem

Rural Bihar runs on patchy 2G and shared Android phones. Government scheme info
lives on heavyweight Hindi-hostile portals that fail the moment the network
drops — exactly when a villager at a CSC kiosk or in the fields needs it. Forms
get half-filled, OTPs expire, deadlines pass.

Sahayak Grid is a **<50 kb initial-JS, Hindi-first PWA kit**: register once,
search 8 schemes transliteration-tolerantly (`kanya` → कन्या), hear benefits via
TTS, track deadlines — **online or off**. Offline writes queue in IndexedDB and
replay idempotently when the network returns.

## Offline architecture

```
┌─ web/ (Astro static, Hindi-first, 48px targets, <50kb initial JS)
│   public/sw.js   — app-shell cache-first; /api/* network-first w/ cache fallback
│   src/lib/store.ts — IndexedDB queue (idb + localStorage + memory fallbacks)
│   queue (offline writes) ── replay on `online` event ──┐
└────────────────────────────────────────────────────────┤
┌─ api/ (Hono — Cloudflare Worker compat, `bun run --hot` for dev) ◀──┘
│   POST /register, GET /schemes?q=, POST /otp/send,
│   POST /otp/verify + /verify-otp (mock 6-digit), GET /alerts,
│   POST /sync (idempotent via client op id) → Postgres (Supabase) / SQLite dev
└─ db/schema.sql (profiles, schemes, alerts, consent_log + RLS)
   db/seed.sql   (8 Bihar schemes, hi+en, upsert by id)
```

**Offline contract:** register + checklist + search work in airplane mode; every
write carries a client-generated op id (`q_<ts>` / `crypto.randomUUID`);
`/sync` dedupes on that id so replays converge instead of duplicating.

**i18n:** Hindi default, English toggle, `speechSynthesis` TTS (hi-IN voice) per
scheme card, transliteration-tolerant search (anusvara/chandrabindu stripped,
`s/sh` + Roman→Devanagari folding: `beti→बेटी`, `awas→आवास`, `loan→ऋण`…).

## Quickstart

```bash
bun install
bun run test      # 51 tests (vitest)
bun run build     # astro build → dist/
bun run preview   # serve dist/ locally

# API dev server (separate terminal)
bun run api:dev   # Hono on :3000 (see api/index.ts)

# Edge deploy
cd api && wrangler deploy   # Cloudflare Worker (wrangler.toml included)

# DB (Supabase SQL editor or psql)
\i db/schema.sql
\i db/seed.sql
```

Docker: `docker build -t sahayak-grid . && docker run -p 4321:4321 sahayak-grid`.

## ✈️ Airplane-mode demo (60 seconds, impresses everyone)

1. `bun run build && bun run preview` → open the page, let the SW install
   (DevTools → Application → Service Workers shows `sg-v2`).
2. Fill **registration** (name, age 21, mobile `98765 43210`), tap **OTP भेजें**,
   enter the demo OTP shown, tick consent, tap **रजिस्टर करें**.
3. Turn on **airplane mode** (or DevTools → Network → Offline). The banner flips
   to `○ ऑफ़लाइन — लेख कतार में सहेजे जाएँगे`.
4. Search `kanya`, `awas`, `loan` — all work. Tap 🔊 on any card — TTS speaks
   Hindi. Tap 🔔 — deadline reminder fires from cache.
5. Register a second profile while offline → **सिंक कतार: 1**.
6. Turn network back on → queue auto-replays (`online` event), badge drops to 0,
   `GET /analytics` shows the queued op exactly once — re-send it manually and
   you get `{ duplicate: true }`.

## API

Base: `/api` (dev) or the Worker URL. All JSON.

| Method | Route | Body / query | Response |
|---|---|---|---|
| GET | `/health` | — | `{ ok, service, time }` |
| GET | `/schemes?q=` | `q` optional (hi or roman) | `{ count, schemes[8] }` |
| POST | `/register` | `{ mobile, name, profile?, consent?, client_uuid? }` | `{ ok, mobile }` / `400 invalid_mobile` |
| POST | `/otp/send` | `{ mobile }` (10-digit, 6–9…) | `{ ok, demoOtp, expiresInSec: 300 }` |
| POST | `/otp/verify` | `{ mobile, code, consent?, profile? }` | `{ ok, token }` / `401 bad_otp` |
| POST | `/verify-otp` | alias (`code` or `otp`) | same as `/otp/verify` |
| GET | `/alerts?mobile=` | `mobile` optional | `{ ok, count, alerts[] }` tiered critical → soon → open → expired |
| POST | `/sync` | `{ id/client_uuid, type, payload }` | `{ ok, id }`, replay-safe `{ duplicate: true }` |
| GET | `/analytics` | — | `{ queued, verified, consents }` |
| GET | `/stats` | — | `{ queued, replayed, failed, duplicates, attempts, verified, consents }` |

## 🆕 v2 — deadline alerts + field analytics

Static scheme data becomes a **living field tool**: deadline-driven urgency
tiers plus analytics proving offline impact.

- **Deadline engine** (`src/lib/deadlines.ts`): `daysLeft` (date-only math),
  `urgencyTier` (critical ≤7d, soon ≤30d, open else, expired past),
  `buildAlerts` (tiered sort), `groupByTier`, Hindi labels (`सिर्फ 3 दिन बचे!`).
- **Alert UI:** homepage countdown badges (`N दिन बचे`, tier colours);
  `/alerts` page grouped critical → soon → open → expired, works offline from
  the seed snapshot and re-renders live from `GET /alerts`; **TTS reads
  urgent alerts first** (critical → soon → open, expired skipped).
- **Sync analytics:** every `POST /sync` increments attempt counters
  (`synced`/`duplicate`/`failed` in memory for dev; `sync_events` table in
  Postgres — see `db/migration_v2.sql`); `GET /stats` exposes them and the
  `/stats` page renders a **live SVG dashboard** (no chart lib) from real API
  data with a build-time snapshot fallback for offline.
- **Seed deadlines** staggered for the Sep-2026 field season: 2 critical
  (`mmsy` 2d, `mbaby` 5d), 3 soon (`mmbsy`, `pmkisan`, `mmkpy`), 3 open
  (`jbsy`, `pmayg`, `bssby`).

### ✈️ Airplane-mode + deadline demo (90 seconds)

1. Terminal A: `bun run api:dev` (Hono on :3000). Terminal B:
   `bun run build && bun run preview` → open the page, let the SW install
   (DevTools → Application → Service Workers shows `sg-v2`).
2. Visit **`/alerts`** — 2 critical schemes on top (`स्वयं सहायता भत्ता`
   सिर्फ 2 दिन बचे!), tap **🔊 ज़रूरी अलर्ट सुनें** — TTS reads critical
   first, Hindi.
3. Turn on **airplane mode**. `/alerts` still renders (seed snapshot +
   `○ ऑफ़लाइन` tag); search + TTS + registration keep working; register a
   profile → **सिंक कतार: 1**.
4. Network back on → queue replays; open **`/stats`** — `attempts` and
   `replayed` went up. Re-send the same op id manually → `{ duplicate: true }`
   and the **duplicates** bar grows while `replayed` doesn't — idempotency,
   visualised.
5. `curl localhost:3000/alerts | jq '.alerts[].tier'` → `critical, critical,
   soon, soon, soon, open, open, open` — tiered ordering, verified.

OTP is **mock 6-digit** (5-min TTL) for demo; production swaps in an SMS
provider server-side — the client contract doesn't change.

## Lighthouse notes (target 95+)

- No webfonts (system stack), no hero images (inline SVG icon only), inline
  critical CSS, zero client JS framework on first paint (Astro static HTML +
  one small inline `<script>`).
- `manifest.webmanifest` + themed `sw.js` → installable, works offline after
  first visit. Test: DevTools → Lighthouse → Mobile → check Performance /
  Accessibility (48 px targets, skip-link, `role="status"` live regions) / PWA.
- Known gap: `/sync` POSTs in the demo page fall back to clearing the queue
  when no API base is configured — wire `window.API_BASE` to the Worker URL in
  production.

## Repo tree

```
sahayak-grid/
  src/{pages/{index,alerts,stats}.astro, data/schemes.ts, lib/{search,eligibility,utils,store,deadlines}.ts}
  public/{sw.js, manifest.webmanifest, icon.svg}
  api/{index.ts (Hono), wrangler.toml}
  db/{schema.sql, seed.sql, migration_v2.sql}
  tests/{api, eligibility, search, utils, deadlines, stats}.test.ts  (51 tests)
  Dockerfile  astro.config.mjs  .github/workflows/ci.yml
```

Screenshots: `docs/` (TODO — add `home-hi.png`, `offline-queue.png`,
`lighthouse.png` after first Pages deploy).

## Who this impresses

- **MERN shops (Qubixo / Trinity / Blazeline / Skillzenloop):** edge-ready REST
  API + static frontend split, idempotent sync queue, 51 green tests, CI.
- **BEMPU Health (REST + PWA):** the offline-first form → queue → replay loop
  is exactly the low-connectivity health-worker flow.
- **Gram Vaani / voice-tech:** Hindi-first UX with per-card TTS and
  transliteration-tolerant search for low-literacy users.

## License

MIT — Prit Kumar. See [LICENSE](./LICENSE).
