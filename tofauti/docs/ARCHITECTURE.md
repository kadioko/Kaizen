# Architecture

## Current Public Web Mode

The deployed Next.js application does not connect to the FastAPI mock runtime. It obtains selected spot OHLC bars through `/api/market/spot`, reads the official FOMC calendar through `/api/macro/us-risk`, and derives only transparent price-action classifications from those sources. The FOMC response identifies a `HIGH` scheduled volatility-risk category and its source basis, while withholding direction and magnitude. True order flow, directional macro, GC/MGC futures, setups, and durable outcomes are withheld until dedicated providers are integrated.

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

The FastAPI production path now supports two explicit modes. `mock` powers local deterministic adapter tests only. `databento` starts independent GC and MGC runtimes with source-normalized CME futures data, dynamic observed levels, live WebSocket snapshots, and durable persistence. It fails closed if a live entitlement is absent.

The public Vercel frontend remains spot-only until the hosted API reports live provider health and its WebSocket client is activated. This prevents an unavailable container, a mock service, or a missing entitlement from being presented as CME data.

## Persistence Boundary

`apps/api/app/repository.py` contains the server-only async Supabase PostgREST repository. When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are both present, each runtime step persists normalized ticks, bars, order-flow buckets, levels, liquidity events, macro states, snapshots, War Room events, setups, and 5/15/30/60-minute outcomes. Without both variables, demo mode remains in memory.

`supabase/migrations/20260912193000_create_tofauti_market_intelligence.sql` owns `tofauti_`-prefixed tables so the product can share the Kaizen Supabase project without colliding with K OG tables. RLS applies to every table. The service role is reserved for server ingestion; browser users are restricted to their own profiles and watchlists.

## Realtime Contract

`GET /api/snapshot/{symbol}` returns the latest snapshot. `WS /ws/market/{symbol}` sends the same Pydantic snapshot payload whenever the runtime advances. `GET /api/calendar` returns the licensed calendar only when configured. Only `GC` and `MGC` are accepted in V0.1.

Snapshots carry source mode, provider and clock metadata independently of transport connection state. The browser validates incoming messages, rejects wrong-symbol/corrupt payloads, reconnects with bounded backoff and marks a silent stream stale after 15 seconds. REST fetches time out after 10 seconds. Server CORS and browser WebSocket origins use `CORS_ORIGINS`; shared scenario mutations default to disabled. `/health` distinguishes configured persistence from successful or failed writes.

GC and MGC now run as independent provider-bound runtimes. This uses two provider sessions in V0.2 so contract attribution is deterministic; a shared multi-symbol session is a later performance optimization, not a change to the engine contracts.

## AI Boundary

`LLMAnalyst` accepts a complete `MarketSnapshot` and returns an explanation tied to supplied evidence. V0.1 includes `MockAIAnalyst` at `POST /api/analyst/query`; it must never call a market-data vendor, infer a missing fact, or overwrite quantitative state.

## Hosting Boundary

Supabase provides database and authentication services. A persistent Docker service can host a future verified futures runtime and WebSockets; `render.yaml` is supplied as one deployment target. Vercel hosts the Next.js frontend and its server-side spot/schedule routes. The public browser does not use the deterministic replay.
