# Architecture

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

V0.1 starts `WarRoomRuntime` in FastAPI lifespan. It pushes one calculated snapshot about every 850 ms to subscribed WebSocket clients. Each demo tick represents one simulated market minute, which makes state-machine and outcome tests fast and reproducible.

Production changes only the runtime host and repositories: a worker subscribes to a provider, persists normalized data, then publishes snapshots via Redis. The market-engine interfaces remain unchanged.

## Persistence Boundary

`apps/api/app/repository.py` contains the server-only async Supabase PostgREST repository. When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are both present, each runtime step persists normalized ticks, bars, order-flow buckets, levels, liquidity events, macro states, snapshots, War Room events, setups, and 5/15/30/60-minute outcomes. Without both variables, demo mode remains in memory.

`supabase/migrations/20260912193000_create_tofauti_market_intelligence.sql` owns `tofauti_`-prefixed tables so the product can share the Kaizen Supabase project without colliding with K OG tables. RLS applies to every table. The service role is reserved for server ingestion; browser users are restricted to their own profiles and watchlists.

## Realtime Contract

`GET /api/snapshot/{symbol}` returns the latest snapshot. `WS /ws/market/{symbol}` sends the same Pydantic snapshot payload whenever the runtime advances. Only `GC` and `MGC` are accepted in V0.1.

## AI Boundary

`LLMAnalyst` accepts a complete `MarketSnapshot` and returns an explanation tied to supplied evidence. V0.1 includes `MockAIAnalyst` at `POST /api/analyst/query`; it must never call a market-data vendor, infer a missing fact, or overwrite quantitative state.

## Hosting Boundary

Supabase provides database and authentication services. A persistent Docker service hosts FastAPI, the mock/live provider runtime, and WebSockets; `render.yaml` is supplied as one deployment target. Vercel hosts the Next.js frontend. The browser uses the public deterministic replay until `NEXT_PUBLIC_API_URL` points to a healthy API host.
