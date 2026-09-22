# Data Providers

## Public Spot Provider

`/api/market/spot` retrieves selected `XAU/USD`, `EUR/USD`, `GBP/USD`, and `USD/JPY` one-minute bars through a server-only `TWELVE_DATA_API_KEY`. It validates the exact symbol, interval, timestamps, OHLC consistency, duplicate bars, and future timestamps before returning a result.

Requests are coalesced per symbol, cached for five minutes, and rate-limit failures back off for 30 minutes. This reduces upstream use but does not provide a global quota budget across regions or other applications sharing a key.

The public UI uses these bars only for transparent spot price-action calculations. It must not relabel them as COMEX futures or derive trade aggressor side, exchange volume, delta, cumulative delta, depth, DOM, order flow, or exchange liquidity from candle movement.

## Official Macro Schedule

`/api/macro/us-risk` reads the Federal Reserve's published FOMC calendar. It exposes only future meeting dates and a source URL. Each FOMC event is marked `HIGH` expected volatility risk because a scheduled US monetary-policy decision can materially affect USD-linked markets. This classification is a documented event-category sensitivity, not a directional forecast, a predicted move size, a probability, or a trade signal. It does not invent event times, forecasts, released values, or directional effect.

## Offline Development Harness

`MockMarketDataProvider` remains in the FastAPI workspace for adapter and engine tests. It is not mounted by the public web application and must never be called live market data.

## Entitled CME Futures Provider

`DatabentoMarketDataProvider` is implemented for the `GLBX.MDP3` dataset and the `GC.FUT` / `MGC.FUT` parent symbols. It consumes the `MBP-1` schema because that carries top-of-book updates and trade records through one normalized boundary.

- Each runtime is bound to exactly one contract so GC and MGC source attribution cannot be mixed.
- Trade aggressor side is inferred only when the trade price matches or trades through the most recent BBO. Any unmatched trade is retained as `unknown_volume`; it does not inflate buy, sell, delta, or cumulative delta.
- Source metadata includes provider, dataset, venue, parent symbol, last event timestamp, reconnect gaps, and callback errors.
- Databento automatic reconnect and 30-second heartbeats are enabled. A reconnection gap is surfaced in source metadata and must be audited before interpreting continuity-sensitive flow data.
- `DEMO_MODE=false`, `MARKET_DATA_PROVIDER=databento`, an entitled `DATABENTO_API_KEY`, and the `databento` server dependency are all required. The API fails fast if any are missing.

The adapter does not claim MBO depth, CME-provided aggressor flags, or historical continuity beyond what is actually subscribed and persisted. Follow [Live Futures Runbook](LIVE_FUTURES_RUNBOOK.md) before enabling GC/MGC public screens.

## Licensed Economic Calendar

`TradingEconomicsCalendarProvider` is implemented as a separate timing and release-data source. It returns UTC event time, country, currency, importance, actual, consensus forecast, previous, revised value, and source metadata. Provider importance is mapped transparently as `1 = LOW`, `2 = MEDIUM`, and `3 = HIGH` expected volatility risk. The mapping is retained in each event's `impact_basis`; it never infers a market direction. Events are persisted in `tofauti_calendar_events` when Supabase ingestion is healthy.

Calendar data is not a directional macro factor. Without separately licensed live USD, real-yield, risk-sentiment, inflation, and central-bank inputs, the macro layer stays unavailable and alignment is labelled incomplete rather than full.

## Data Quality Rules

- Preserve source name, timestamp, symbol, asset class, and freshness in every user-facing display.
- Reject malformed or out-of-order inputs before calculation.
- Persist raw input before derived data when durable ingestion is enabled.
- Withhold a metric when the source cannot support it.
- Never label delayed, spot, replayed, or mock data as live futures or exchange order flow.
