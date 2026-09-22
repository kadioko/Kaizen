# Architecture

## Current Public Web Mode

The deployed Next.js application does not connect to the FastAPI mock runtime. It obtains selected spot OHLC bars through `/api/market/spot`, reads the official FOMC calendar through `/api/macro/us-risk`, and derives only transparent price-action classifications from those sources. True order flow, directional macro, GC/MGC futures, setups, and durable outcomes are withheld until dedicated providers are integrated.

## System Shape

```text
MockMarketDataProvider
        |
   MarketTick
        |
 market-engine (pure, explainable Python)
  | order flow | structure | liquidity | macro | alignment |
        |
 WarRoomRuntime + state machine
        |
 MarketSnapshot / WarRoomEvent / Setup
        |
 FastAPI REST + WebSocket
        |
 Next.js War Room PWA
```

## Repository Responsibilities

- `apps/web`: Next.js 16 PWA and real-time user interface.
- `apps/api`: FastAPI REST and WebSocket boundary. It does not calculate trading conditions itself.
- `services/market-worker`: production home for a standalone runtime worker. In V0.1 the worker runs in the API process so local demo mode does not require Redis.
- `packages/market-engine`: provider-neutral Python domain models, engines, state machine, and outcome evaluator.
- `packages/shared-types`: frontend contracts for streamed snapshot payloads.
- `infrastructure`: Dockerized PostgreSQL, optional Redis, and first schema.

## Runtime Modes

The FastAPI `WarRoomRuntime` remains an offline development harness. It pushes calculated mock snapshots about every 850 ms so provider adapters and state-machine behavior can be tested reproducibly. It is not mounted by public web pages.

The intended production architecture uses a separate worker, verified provider normalization and durable storage before publishing snapshots. That path is not implemented. Existing engines still contain demo-specific supply/demand levels and minute-observation assumptions, so live integration requires normalization and engine validation in addition to changing the host.

## Persistence Boundary

`apps/api/app/repository.py` contains the server-only async Supabase PostgREST repository. When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are both present, each runtime step persists normalized ticks, bars, order-flow buckets, levels, liquidity events, macro states, snapshots, War Room events, setups, and 5/15/30/60-minute outcomes. Without both variables, demo mode remains in memory.

`supabase/migrations/20260912193000_create_tofauti_market_intelligence.sql` owns `tofauti_`-prefixed tables so the product can share the Kaizen Supabase project without colliding with K OG tables. RLS applies to every table. The service role is reserved for server ingestion; browser users are restricted to their own profiles and watchlists.

## Realtime Contract

`GET /api/snapshot/{symbol}` returns the latest snapshot. `WS /ws/market/{symbol}` sends the same Pydantic snapshot payload whenever the runtime advances. Only `GC` and `MGC` are accepted in V0.1.

Snapshots carry source mode, provider and clock metadata independently of transport connection state. The browser validates incoming messages, rejects wrong-symbol/corrupt payloads, reconnects with bounded backoff and marks a silent stream stale after 15 seconds. REST fetches time out after 10 seconds. Server CORS and browser WebSocket origins use `CORS_ORIGINS`; shared scenario mutations default to disabled. `/health` distinguishes configured persistence from successful or failed writes.

MGC currently projects the same GC simulated scenario with MGC contract specifications; it is not an independent MGC feed. The setup-history endpoint filters by the actually stored instrument instead of presenting GC history as MGC history.

## AI Boundary

`LLMAnalyst` accepts a complete `MarketSnapshot` and returns an explanation tied to supplied evidence. V0.1 includes `MockAIAnalyst` at `POST /api/analyst/query`; it must never call a market-data vendor, infer a missing fact, or overwrite quantitative state.

## Hosting Boundary

Supabase provides database and authentication services. A persistent Docker service can host a future verified futures runtime and WebSockets; `render.yaml` is supplied as one deployment target. Vercel hosts the Next.js frontend and its server-side spot/schedule routes. The public browser does not use the deterministic replay.
