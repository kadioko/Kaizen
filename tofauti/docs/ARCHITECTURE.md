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

The supplied PostgreSQL schema includes instruments, ticks, bars, order-flow buckets, levels, liquidity events, macro states, snapshots, War Room events, setups, setup outcomes, users, and watchlists. Demo mode retains data in memory to make a local run dependency-free. Timescale hypertables are intentionally deferred until a production PostgreSQL/Timescale target is selected.

## Realtime Contract

`GET /api/snapshot/{symbol}` returns the latest snapshot. `WS /ws/market/{symbol}` sends the same Pydantic snapshot payload whenever the runtime advances. Only `GC` and `MGC` are accepted in V0.1.

## AI Boundary

`LLMAnalyst` accepts a complete `MarketSnapshot` and returns an explanation tied to supplied evidence. V0.1 includes `MockAIAnalyst` at `POST /api/analyst/query`; it must never call a market-data vendor, infer a missing fact, or overwrite quantitative state.
