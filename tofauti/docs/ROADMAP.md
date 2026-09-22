# Roadmap

## Current Readiness

- ✅ Core simulation fixes and regression tests: see [Readiness Audit](READINESS_AUDIT.md).
- ✅ Truthful source labels, consistent replay arithmetic, full four-layer alignment, bounded stream recovery, selected live spot references, and official FOMC risk dates.
- 🟠 Simulation MVP only. "Complete" below means implemented demo scope, not a production trading service.
- 🔴 Persistent backend hosting and live Supabase ingestion/readback still require deployment verification.
- 🔴 Verified futures feed and real market-data normalization remain unimplemented.
- 🟠 Spot data is provider-reported but remains an independent reference layer; it is not a futures/order-flow feed and needs a centralized quota budget before scale.
- ⚪ Durable journal history, complete entry snapshots, cross-engine parity, global API budgeting and live account isolation tests remain open.

## Complete: V0.1 Vertical Slice

- GC/MGC instrument model and deterministic demo provider.
- Explainable order-flow, structure, liquidity, macro, alignment, and War Room state engines.
- FastAPI REST and WebSocket snapshot stream.
- Next.js dark terminal War Room with lightweight candlesticks, levels, timeline, and scenario controls.
- PostgreSQL schema foundation, optional Redis Docker profile, PWA manifest, and engine tests.

## Complete: V0.2 Cloud-Ready Foundation

- GC/MGC contract selection and expanded directional state-machine coverage.
- Snapshot-backed Macro, Order Flow, Levels, Journal, and Settings screens.
- Delta histogram and visible-bar volume-by-price profile, clearly labelled as demo calculations.
- Supabase migration, RLS policies, server-only persistence repository, browser Auth/watchlist controls, and Docker hosting blueprint.

## Complete: V0.3 External Reference Layer

- Server-only cached Twelve Data selected-spot route for `XAU/USD`, `EUR/USD`, `GBP/USD`, and `USD/JPY`, with timestamp and freshness metadata.
- Official Federal Reserve FOMC schedule shown as source-backed event risk, without fabricated impact claims.
- Prominent War Room data-quality labels that distinguish replay transport, external spot reference, and an eventual API stream.
- Hard boundary preventing the spot reference from being treated as GC/MGC futures, order flow, or a setup input.

## Active Blockers

- Configure a persistent FastAPI host and set its URL in Vercel.
- Add verified Databento/CME credentials and exchange entitlements before enabling a live provider.

## Phase 2: Professional Market Data

- Databento/CME integration without changing market-engine interfaces.
- NQ/MNQ and ES/MES support.
- Provider health, reconnect policy, source freshness, and data-quality telemetry.

## Phase 3: Context and Alerts

- Economic-calendar API.
- Live macro feeds.
- Server-side alert routing and web/mobile push notifications.

## Phase 4: Measurement

- Historical market replay and backtesting.
- Probability calibration only after statistically meaningful observed outcomes.
- Historical setup statistics, execution assumptions, and data-quality reporting.

## Phase 5: AI Analyst and Scanner

- Grounded LLM analyst with record citations and explicit user request.
- Multi-market scanner and heatmap.
- No AI-owned calculation or signal generation.

## Phase 6: SaaS

- Authentication, subscriptions, billing, teams, watchlists, and permissions.
- Retention policies, audit logs, and deployment observability.
