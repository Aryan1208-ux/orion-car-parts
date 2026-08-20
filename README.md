# Orion Car Parts — monorepo

Full-stack storefront for the Orion Car Parts catalog (used OEM engines &
transmissions): **Medusa v2** backend + **Next.js 15** storefront, seeded from
`../data/processed/products_orion.jsonl` (the rebranded scrape dataset).

```
orion-monorepo/
├── docker-compose.yml      # Postgres 16 → localhost:5442 (db: orion)
├── apps/
│   ├── backend/            # Medusa 2.18 → http://localhost:9002 (admin at /app)
│   └── storefront/         # Next.js 15  → http://localhost:3000
```

## Run it

```bash
pnpm db:up            # start Postgres (Docker)
pnpm dev:backend      # Medusa on :9002
pnpm dev:storefront   # Next.js on :3000
```

First-time setup (already done on this machine):

```bash
pnpm install
cd apps/backend
npx medusa db:migrate
npx medusa user -e admin@orioncarparts.com -p orionadmin123
pnpm seed            # 600 products (SEED_LIMIT env to change)
pnpm seed:all        # full catalog (~52k products after dedupe, ~10 min)
```

The seed is idempotent/resumable — it skips products whose handle already
exists, so re-running is safe. It prints the publishable API key; put it in
`apps/storefront/.env.local` as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

**Fresh clone without the scraped dataset?** No problem — the seed
automatically falls back to the bundled sample at
`apps/backend/seed-data/products-sample.jsonl` (600 diverse products across
all 37 makes, every one with a real part photo), so `pnpm seed` gives you a
fully working demo store. The full ~52k dataset lives outside git
(`../data/processed/products_orion.jsonl`, regenerated via `run_all.py` in
the repo root) and is picked up automatically when present; `SEED_FILE` env
var overrides both.

## What's seeded

- Region **United States** (USD, manual/system payment provider)
- Sales channel **Orion Storefront** + publishable key (linked to that channel only)
- Stock location **Houston Warehouse**, shipping options **Standard Freight
  (free)** and **Liftgate + Residential ($75)**
- Categories: Used Engines / Used Transmissions / Used Auto Parts
- One collection per make (Ford, Chevy, BMW, …37 makes)
- Products: title/handle/price/images from the dataset; specs (make, model,
  year, engine size, VIN code, mileage, …) and the rebranded
  `description_html` in `product.metadata`; single variant per product with
  `manage_inventory: false`

## Storefront

- `/` — Orion Home design (from `Orion Home.html`): topbar, sticky header,
  hero with the **smart fitment finder** (pattern from
  `parts-finder-option-1.html`) and a real-inventory engine spotlight card
  that live-swaps to the top matching part while you search,
  trust strip, featured products, how-it-works, warranty, shop-by-make,
  reviews, FAQ, quote banner + modal, footer
- The finder has three tabs: **Describe it** (free text + voice input via the
  Web Speech API), **VIN** (camera barcode scan via BarcodeDetector + free
  decode through the NHTSA vPIC API, with an Engine/Transmission choice), and
  **License plate** (real lookup via PlateToVIN — plate + state → VIN through
  the server-side proxy at `apps/storefront/app/api/plate-lookup/route.ts`
  ($0.05 per successful lookup, 404s free), then the same NHTSA decode as the
  VIN tab; falls back to the quote/parts-expert flow when the plate can't be
  resolved. Requires `PLATETOVIN_API_KEY` in `apps/storefront/.env.local`
  AND an active billing plan on platetovin.com). Results appear in a dismissible popover — what we understood,
  tap-to-edit rows, live inventory count — that closes on ×, Esc, outside
  click, or clearing the input.
- Product images: only SKU-tagged part photos (`ENG-*`/`TRN-*`) are seeded —
  donor-vehicle photos in the dataset are filtered out (and were purged from
  the DB); photo-less products get a styled placeholder. Catalog and featured
  queries sort newest-first so photo-rich listings surface.
- `/parts` — catalog with search / part-type / make / year filters + pagination
- `/parts/[handle]` — PDP with spec table, description, add to cart
- `/cart`, `/checkout` — full checkout against Medusa (system payment
  provider, no card), order confirmation at `/order/confirmed/[id]`

## Credentials & endpoints

| What | Value |
| --- | --- |
| Admin dashboard | http://localhost:9002/app |
| Admin login | admin@orioncarparts.com / orionadmin123 |
| Store API | http://localhost:9002/store (needs `x-publishable-api-key`) |
| Postgres | postgres://postgres:postgres@localhost:5442/orion |

Ports 5442/9002 were chosen to avoid this machine's other projects
(5432/9000 are taken by `infra-postgres-1` / minio).
