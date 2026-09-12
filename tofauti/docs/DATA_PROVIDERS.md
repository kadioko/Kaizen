# Data Providers

## Provider Interfaces

`MarketDataProvider` defines `connect`, `disconnect`, `subscribe`, `trades`, `quotes`, and `historical`. Every implementation must normalize vendor data to `MarketTick` before it enters an engine.

`MacroDataProvider` normalizes named macro factors with a state, directional effect, score, timestamp, and source.

## V0.1: Mock Only

`MockMarketDataProvider` produces deterministic GC/MGC prices, bid/ask, volume, aggressive trade direction, and buy/sell volume. It is clearly labeled in UI/API responses as simulation. No screen claims exchange data, institutional order flow, or a live professional feed.

## Future Databento/CME Adapter

Create `DatabentoMarketDataProvider` in this package. It must translate the vendor response to the existing `MarketTick` contract and must not alter an engine signature. Validate exchange entitlements, symbol mappings, timestamps, trade aggressor rules, and reconnect behavior at that boundary.

## Data Quality Requirements

- Preserve source timestamps and source names.
- Reject invalid bid/ask, non-positive volume, and out-of-order inputs before aggregation.
- Persist raw input before derived buckets in production mode.
- Distinguish delayed, replayed, mock, and real sources in every user-facing view.
- Never describe a data source with a venue or quality label it has not earned.
