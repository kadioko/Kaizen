# TOFAUTI

TOFAUTI is an explainable live spot-market price-action workspace. It does not issue broker orders, promise outcomes, or display calculated strength as a winning probability.

## Current Public Product

- Live provider-reported one-minute OHLC bars: `XAU/USD`, `EUR/USD`, `GBP/USD`, and `USD/JPY` through a server-side Twelve Data bridge.
- Live calculated price-action context: recent structure, rolling high/low references, round-number references, range acceptance, and range rejection observations.
- Live source-bar timeline: timestamped observations derived only from the returned OHLC bars.
- Official macro-risk schedule: upcoming FOMC meeting dates from the Federal Reserve.
- Persistent auth and watchlist interfaces remain separately scoped through Supabase.

The public web application no longer mounts the browser replay provider or displays GC/MGC simulated prices, delta, setups, or replay controls.

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
- `GET /api/macro/us-risk` reads and caches the official Federal Reserve FOMC schedule. It is scheduled-risk context only, not an impact forecast.

## Verification

```bash
npm run test:web
npm run typecheck:web
npm run lint:web
npm run build:web
python -m pytest tests -q
```

## Future Provider Path

The FastAPI mock engine and its deterministic scenarios remain an offline development harness for adapter tests. They are not used by the public frontend. Before enabling a live futures/order-flow workspace, connect an entitled provider such as Databento/CME behind the existing provider interfaces, validate source quality, and store raw input before derived calculations.

Read [Data Providers](docs/DATA_PROVIDERS.md), [Architecture](docs/ARCHITECTURE.md), [Market Engine](docs/MARKET_ENGINE.md), and [Roadmap](docs/ROADMAP.md) before adding a provider.
