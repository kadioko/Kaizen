# Data Providers

## Provider Interfaces

`MarketDataProvider` defines `connect`, `disconnect`, `subscribe`, `trades`, `quotes`, and `historical`. Every implementation must normalize vendor data to `MarketTick` before it enters an engine.

`MacroDataProvider` normalizes named macro factors with a state, directional effect, score, timestamp, and source.

## V0.1: Mock Only

`MockMarketDataProvider` produces deterministic GC/MGC prices, bid/ask, volume, aggressive trade direction, and buy/sell volume. It is clearly labeled in UI/API responses as simulation. No screen claims exchange data, institutional order flow, or a live professional feed.

## V0.3: Twelve Data Gold Spot Reference

The Next.js server route at `/api/reference/gold` can fetch an `XAU/USD` spot quote and 1-minute bars from Twelve Data when a server-only `TWELVE_DATA_API_KEY` is configured. It caches upstream calls for 25 seconds, preserves the provider bar timestamp, reports freshness, and returns no data when the provider response is invalid.

This is a price reference, not a `MarketDataProvider` implementation: `XAU/USD` must not be relabeled as COMEX `GC` or `MGC`, and it cannot supply trade aggressor side, bid/ask depth, exchange volume, or order flow. The UI therefore presents it separately and prevents it from informing the replay's order-flow, liquidity, alignment, score, or setup state.

## Future Databento/CME Adapter

Create `DatabentoMarketDataProvider` in this package. It must translate the vendor response to the existing `MarketTick` contract and must not alter an engine signature. Validate exchange entitlements, symbol mappings, timestamps, trade aggressor rules, and reconnect behavior at that boundary.

No Databento/CME adapter is enabled because no provider key, exchange entitlement, or user-approved symbol mapping has been configured. The GC/MGC engine continues to identify its source as deterministic replay until that boundary is connected and verified.

## Data Quality Requirements

- Preserve source timestamps and source names.
- Reject invalid bid/ask, non-positive volume, and out-of-order inputs before aggregation.
- Persist raw input before derived buckets in production mode.
- Distinguish delayed, replayed, mock, and real sources in every user-facing view.
- Never describe a data source with a venue or quality label it has not earned.
