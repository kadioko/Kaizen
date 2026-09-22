# TOFAUTI

TOFAUTI is an original, explainable market-intelligence war room. It translates normalized market data into order flow, structure, liquidity, macro, alignment, and timestamped state transitions. It does not issue broker orders, promise outcomes, or present calculated strength as a winning probability.

## V0.1 Scope

- Instruments: `GC` Gold Futures and `MGC` Micro Gold Futures.
- GC/MGC engine data: deterministic mock data, clearly labeled in the UI.
- Live spot reference: server-side one-minute bars from Twelve Data for `XAU/USD`, `EUR/USD`, `GBP/USD`, and `USD/JPY`, visibly separated from the GC/MGC futures replay.
- Official macro-risk schedule: upcoming FOMC meeting dates are read from the Federal Reserve calendar. They are scheduled-risk context only, never a directional forecast.
- Calculated display states: `BULLISH`, `BEARISH`, `NEUTRAL` and `WEAK`, `MODERATE`, `STRONG`.
- Core sequence: tick -> order flow -> structure -> liquidity -> macro -> alignment -> War Room event -> setup record.

## Run Locally

Prerequisites: Node 24+, Python 3.12+, and optionally Docker.

```bash
cd tofauti
copy .env.example .env
npm install
pip install -r apps/api/requirements.txt
```

Start the API in one terminal:

```bash
npm run dev:api
```

Start the web app in another terminal:

```bash
npm run dev:web
```

Open `http://localhost:3001/war-room`. Without `NEXT_PUBLIC_API_URL`, local and deployed frontends both run the browser replay. To test FastAPI, set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `apps/web/.env.local` and restart Next.js. Export backend variables in your shell, or run Uvicorn with `--env-file .env`; copying the root example alone does not load it.

## Public Demo Deployment

The web app can be deployed independently to Vercel for a shareable demo. Without `NEXT_PUBLIC_API_URL`, the deployed app runs an explicitly labelled deterministic browser replay so the War Room remains usable without exposing a local API. It is not live market data and it does not use a broker.

Set `NEXT_PUBLIC_API_URL` only after deploying the FastAPI/WebSocket service to a public, secure host. The UI will then use the hosted engine rather than the browser replay.

For the complete Supabase, Docker-hosting, and Vercel configuration sequence, read [Deployment](docs/DEPLOYMENT.md).

## Live Spot References

When `TWELVE_DATA_API_KEY` is configured on Vercel, `/api/market/spot` retrieves current provider-reported one-minute bars server-side for `XAU/USD`, `EUR/USD`, `GBP/USD`, and `USD/JPY`. The dashboard requests only the market selected by the user and refreshes it every five minutes to preserve the configured provider allowance. The displayed price is the latest returned bar close, paired with that same bar's start timestamp. It is not an executable quote. `RECENT BAR` only describes timestamp age, not verified market activity. Quota exhaustion is displayed explicitly and backs off for 30 minutes.

These references are not COMEX GC/MGC futures quotes, do not include exchange order flow or depth, and never power a TOFAUTI setup, score, or trade state. A Databento/CME entitlement remains required before the futures engine can be described as live.

## Official Macro Risk

`/api/macro/us-risk` retrieves FOMC meeting dates from the official Federal Reserve calendar and caches the schedule. It does not invent event times, forecasts, outcomes, or price impact. A licensed economic-calendar provider is still required before the product can show a complete global calendar, consensus, actual values, or a real-time news feed.

## Demo Mode

`DEMO_MODE=true` is the default. The `MockMarketDataProvider` is deterministic and supports these replayable scenarios:

- `bearish_liquidity_sweep`
- `bullish_reversal`
- `mixed`
- `macro_divergence`
- `full_alignment`

Use browser replay controls in War Room to reset a scenario; an additional browser-only `invalidation` scenario exercises failure after confirmation. Browser events use a fixed synthetic clock and repeatable inputs. Server demo controls are disabled by default because they reset every connected user's shared runtime; enable `ALLOW_DEMO_CONTROLS=true` only on a private development server. The bearish sweep follows supply approach -> buy-side sweep -> seller pressure -> full bearish alignment -> confirmed setup -> continuation. This is synthetic behavior for application testing, not historical market data.

## Optional Local Infrastructure

PostgreSQL starts with a local mirror of the TOFAUTI schema; Redis is optional and is not needed for demo mode. FastAPI uses Supabase persistence when both server-only Supabase variables are configured. The local Docker database is provided for schema inspection and future local repository integration.

```bash
docker compose -f infrastructure/docker-compose.yml up -d
docker compose -f infrastructure/docker-compose.yml --profile cache up -d
```

## Verification

```bash
python -m pytest tests -q
npm run test:web
npm run typecheck:web
npm run lint:web
npm run build:web
```

## Product Boundaries

- The market engine owns calculations and stores raw evidence for every displayed state.
- `MockAIAnalyst` is available at `POST /api/analyst/query` and only explains the supplied current snapshot. It cannot create market data, fill missing data, or generate an unsupported signal.
- `MockMarketDataProvider` is intentionally interchangeable with a future provider implementation. The intended next integration prompt is: **“Replace MockMarketDataProvider with Databento/CME data without changing the market-engine interfaces.”**
- A Vercel preview without a configured hosted API deliberately uses the browser replay; it must never be described as a live market feed.
- The Twelve Data bridge supplies selected spot-market references only. It is intentionally prevented from creating GC/MGC order-flow or setup claims.
- The public Supabase URL and anon key may be configured in the web app for Auth. `SUPABASE_SERVICE_ROLE_KEY` is server-only and is used only by FastAPI for market ingestion.

Read [Architecture](docs/ARCHITECTURE.md), [Market Engine](docs/MARKET_ENGINE.md), [Data Providers](docs/DATA_PROVIDERS.md), and [Roadmap](docs/ROADMAP.md) before adding a live feed.

For the verified fixes and outstanding release requirements, see [Readiness Audit](docs/READINESS_AUDIT.md). The product remains a simulation MVP, not a live futures trading intelligence service.
