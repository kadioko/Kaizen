# Data Providers

## Provider Interfaces

`MarketDataProvider` defines `connect`, `disconnect`, `subscribe`, `trades`, `quotes`, and `historical`. Every implementation must normalize vendor data to `MarketTick` before it enters an engine.

`MacroDataProvider` normalizes named macro factors with a state, directional effect, score, timestamp, and source.

## V0.1: Mock Only

`MockMarketDataProvider` produces deterministic GC/MGC prices, bid/ask, volume, aggressive trade direction, and buy/sell volume. It is clearly labeled in UI/API responses as simulation. No screen claims exchange data, institutional order flow, or a live professional feed.

## V0.3: Twelve Data Spot References

The Next.js server route at `/api/market/spot` fetches the user-selected `XAU/USD`, `EUR/USD`, `GBP/USD`, or `USD/JPY` one-minute bars using a server-only `TWELVE_DATA_API_KEY`. The displayed price and timestamp belong to the same bar. Requests are coalesced per market per server instance, cached for five minutes and shared through CDN response caching. Hidden tabs pause polling; provider quota failures trigger a 30-minute backoff. This reduces usage but is not a global quota guarantee across regions or other apps sharing the key. A centralized quota ledger remains necessary for scale.

OHLC values, positive prices, unique timestamps, requested market symbol, interval and future timestamps are validated. The request explicitly asks for UTC; `exchange_timezone` describes the source venue and need not match the requested output timezone. `RECENT BAR` means the bar start is no older than six minutes, not that the market is open or the price executable. UI age advances even between fetches. Source format: [Twelve Data API documentation](https://twelvedata.com/docs).

This is a price-reference layer, not a `MarketDataProvider` implementation: `XAU/USD` must not be relabeled as COMEX `GC` or `MGC`, and none of the supported spot references can supply trade aggressor side, bid/ask depth, exchange volume, or order flow. The UI therefore presents them separately and prevents them from informing the replay's order-flow, liquidity, alignment, score, or setup state.

## V0.3: Official Macro Risk

`/api/macro/us-risk` reads upcoming FOMC meeting dates from the [Federal Reserve calendar](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm). It is source-backed scheduled-risk context only: TOFAUTI does not assign market direction, invent release times, or simulate actual/consensus values. A licensed calendar provider remains necessary for a complete global event schedule and released data.

## Future Databento/CME Adapter

Create `DatabentoMarketDataProvider` in this package. It must translate the vendor response to the existing `MarketTick` contract and must not alter an engine signature. Validate exchange entitlements, symbol mappings, timestamps, trade aggressor rules, and reconnect behavior at that boundary.

No Databento/CME adapter is enabled because no provider key, exchange entitlement, or user-approved symbol mapping has been configured. The GC/MGC engine continues to identify its source as deterministic replay until that boundary is connected and verified.

## Data Quality Requirements

- Preserve source timestamps and source names.
- Reject invalid bid/ask, non-positive volume, and out-of-order inputs before aggregation.
- Persist raw input before derived buckets in production mode.
- Distinguish delayed, replayed, mock, and real sources in every user-facing view.
- Never describe a data source with a venue or quality label it has not earned.
