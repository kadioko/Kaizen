# TOFAUTI

TOFAUTI is an explainable live spot-market price-action workspace. It does not issue broker orders, promise outcomes, or display calculated strength as a winning probability.

## Current Public Product

- Live provider-reported one-minute OHLC bars: `XAU/USD`, `EUR/USD`, `GBP/USD`, and `USD/JPY` through a server-side Twelve Data bridge.
- Live calculated price-action context: recent structure, rolling high/low references, round-number references, range acceptance, and range rejection observations.
- Live source-bar timeline: timestamped observations derived only from the returned OHLC bars.
- Official macro-risk schedule: upcoming FOMC meeting dates from the Federal Reserve, labelled as `HIGH` expected volatility risk with an explicit non-directional boundary.
- Global Session Clock: current Sydney, Tokyo, London, and New York regional session windows, including active overlaps such as London/New York.
- Display-timezone preference: device-detected by default, configurable with an IANA timezone in Settings, and applied to visible bars and War Room timeline times.
- Effective-use guide: an in-product workflow for timing, risk checks, live-source validation, and safe interpretation boundaries.
- Persistent auth and watchlist interfaces remain separately scoped through Supabase.

The public web application no longer mounts the browser replay provider or displays GC/MGC simulated prices, delta, setups, or replay controls.

Regional session timing is calculated from each session center's IANA timezone, so daylight saving time adjusts automatically. It is a schedule reference only: it does not measure liquidity, volume, market participation, or a trade opportunity.

## Deliberate Data Boundaries

The current spot feed cannot provide the following, so TOFAUTI labels them unavailable rather than approximating them:

- GC/MGC COMEX futures prices.
- True order flow: trade aggressor side, exchange volume, delta, cumulative delta, depth, DOM, or exchange liquidity.
- Directional macro score: live USD, real yields, risk sentiment, inflation, central-bank demand, consensus, and released macro values are not connected.
- Trade plans, entry signals, performance probabilities, or automatic live journal records.

The War Room's `BULLISH`, `BEARISH`, and `NEUTRAL` labels are transparent technical classifications from current returned spot bars only. They are not financial advice or trade instructions.

## Run Locally

Prerequisites: Node 24+ and Python 3.12+ for the optional future API harness.

```bash
cd tofauti
npm install
npm run dev:web
```

Open `http://localhost:3001/war-room`.

Set `TWELVE_DATA_API_KEY` in `apps/web/.env.local` for local live spot references. The key is read only by the Next.js route handler and must never be prefixed with `NEXT_PUBLIC_`.

## Public API Routes

- `GET /api/market/spot?symbol=XAU%2FUSD` supports the four listed spot symbols, validates returned OHLC, and caches each selected symbol for five minutes.
- `GET /api/macro/us-risk` reads and caches the official Federal Reserve FOMC schedule. FOMC is labelled `HIGH` expected volatility risk because it is a scheduled policy decision for USD-linked markets. The label is not a forecast of price direction, size, or trade outcome.

## Verification

```bash
npm run test:web
npm run typecheck:web
npm run lint:web
npm run build:web
python -m pytest tests -q
```

## Live Futures Engine

The FastAPI workspace now contains a `DatabentoMarketDataProvider` for `GC.FUT` and `MGC.FUT` on the entitled `GLBX.MDP3` dataset. It consumes `MBP-1` records, preserves source provenance, and classifies aggressor side only when a trade can be matched to the current top-of-book. Unmatched trades are stored as unknown volume and are not forced into delta.

The adapter is implemented but intentionally inactive until its required server-only entitlement is configured. Use the [live futures runbook](docs/LIVE_FUTURES_RUNBOOK.md) to apply the Supabase migration, deploy the persistent container service, configure secrets, validate `/health`, then connect the Vercel frontend. The public site must continue to show the live spot-only boundary until that verification succeeds.

Read [Data Providers](docs/DATA_PROVIDERS.md), [Architecture](docs/ARCHITECTURE.md), [Deployment](docs/DEPLOYMENT.md), [Live Futures Runbook](docs/LIVE_FUTURES_RUNBOOK.md), [Market Engine](docs/MARKET_ENGINE.md), and [Roadmap](docs/ROADMAP.md) before enabling a provider.

## Dependency Policy

The web workspace is verified with Next.js 16, React 19, Tailwind 4, TypeScript 7, Lightweight Charts 5, Lucide 1, Supabase JS 2, and ESLint 9. `npm audit --omit=dev` reports no production vulnerabilities. ESLint stays on its newest compatible 9.x release because the current Next.js ESLint integration is not compatible with ESLint 10.

The FastAPI workspace uses the latest compatible FastAPI, Uvicorn, Pydantic, and Databento releases. `databento-dbn` and `pydantic-core` remain on the exact versions required by their respective parent packages; they must not be independently forced forward.

For an evidence-based feature inventory inspired by general market-intelligence dashboard capabilities, see [Capability Audit](docs/CAPABILITY_AUDIT.md). TOFAUTI uses its own product identity and does not copy third-party branding, layouts, or claims.
