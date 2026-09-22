# Roadmap

## Current Release

- ✅ Public War Room uses verified live spot OHLC bars for `XAU/USD`, `EUR/USD`, `GBP/USD`, and `USD/JPY`.
- ✅ Public technical state, rolling levels, range acceptance/rejection, and timeline observations are derived from returned source bars.
- ✅ Official FOMC dates are shown as source-backed `HIGH` scheduled volatility risk, never as a directional forecast.
- ✅ Browser replay is removed from the public app and all secondary screens.
- 🟠 GC/MGC Databento adapter, exchange-derived delta, liquidity events, WebSockets, and Supabase repository are built but await licensed keys, applied migrations, and a persistent host.
- 🟠 Delta histogram, cumulative delta, traded-volume profile, and top-ten market-by-price ladder are built as a live-engine surface but await an entitled hosted exchange feed. A full market-by-order heatmap remains unbuilt.
- 🟠 The calendar adapter is built but awaits a licensed Trading Economics key and host. The public FOMC schedule remains the narrow live fallback.
- 🟠 Setup outcome aggregation is built around observed elapsed 5/15/30/60-minute paths but awaits durable exchange ingestion before its analytics can be useful.
- 🔴 Directional macro inputs, production AI, multi-market heatmap, and broader market coverage still require new verified sources and operating controls.

## Phase 1: Live Spot Price Action

- Selected spot provider route with timestamp, freshness, validation, quota backoff, and no mock fallback.
- Explainable technical classifications from current OHLC: recent structure, rolling high/low references, round-number references, range acceptance, and range rejection.
- Public availability boundaries for order flow, macro direction, setup generation, and journaling.

## Phase 2: Professional Futures Data

- Databento/CME integration without changing market-engine interfaces.
- Verify the entitlement, symbol mapping, contract rollover, source timestamps, trade-aggressor classification, tick precision, and gap recovery before enabling a GC/MGC live view.
- NQ/MNQ are catalogued with explicit production activation guards. Validate parent symbols, CME rights, roll handling, timestamps, and health before activation.
- Add ES/MES only after the provider boundary is verified.

## Phase 3: Live Context and Alerts

- Licensed economic calendar with global events, consensus, released values, source attribution, and transparent `LOW` / `MEDIUM` / `HIGH` volatility-impact labels. Do not scrape Investing.com or Forex Factory; see [Calendar Sourcing](CALENDAR_SOURCING.md).
- Verified macro inputs for USD, real yields, inflation, risk sentiment, and central-bank demand.
- Server-side alerts and web/mobile notification strategy.

## Phase 4: Measurement

- Persist raw inputs and immutable snapshots before calculated results.
- Observed setup outcomes, execution assumptions, historical replay, and data-quality reporting.
- Probability calibration only after statistically meaningful observed outcomes.

## Phase 5: AI Analyst and Scanner

- Grounded server-side analyst with authenticated, stored-context citations, rate limits, and audit logs.
- Multi-market scanner and heatmap.
- AI explains verified calculations only; it does not own data collection or generate unsupported signals.

## Phase 6: SaaS

- Authentication, subscriptions, billing, teams, permissions, retention, and deployment observability.
