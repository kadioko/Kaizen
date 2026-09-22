# Data Providers

## Public Spot Provider

`/api/market/spot` retrieves selected `XAU/USD`, `EUR/USD`, `GBP/USD`, and `USD/JPY` one-minute bars through a server-only `TWELVE_DATA_API_KEY`. It validates the exact symbol, interval, timestamps, OHLC consistency, duplicate bars, and future timestamps before returning a result.

Requests are coalesced per symbol, cached for five minutes, and rate-limit failures back off for 30 minutes. This reduces upstream use but does not provide a global quota budget across regions or other applications sharing a key.

The public UI uses these bars only for transparent spot price-action calculations. It must not relabel them as COMEX futures or derive trade aggressor side, exchange volume, delta, cumulative delta, depth, DOM, order flow, or exchange liquidity from candle movement.

## Official Macro Schedule

`/api/macro/us-risk` reads the Federal Reserve's published FOMC calendar. It exposes only future meeting dates and a source URL. It does not invent event times, forecasts, released values, or directional effect.

## Offline Development Harness

`MockMarketDataProvider` remains in the FastAPI workspace for adapter and engine tests. It is not mounted by the public web application and must never be called live market data.

## Future Futures Provider

`DatabentoMarketDataProvider` or a similarly entitled CME adapter must normalize raw vendor messages to the existing provider contract without changing analytics-engine interfaces. Validate contract mapping, rollover, source timestamps, trade-aggressor rules, reconnect behavior, and the entitlement itself at that boundary before enabling GC/MGC public screens.

## Data Quality Rules

- Preserve source name, timestamp, symbol, asset class, and freshness in every user-facing display.
- Reject malformed or out-of-order inputs before calculation.
- Persist raw input before derived data when durable ingestion is enabled.
- Withhold a metric when the source cannot support it.
- Never label delayed, spot, replayed, or mock data as live futures or exchange order flow.
