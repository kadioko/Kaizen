# Market Engine

> The Python order-flow engine is an offline provider-adapter harness. The current public web app does not call it because its live spot source does not supply the required trade-level inputs. Public screens withhold order-flow conclusions rather than simulate them.

## Principle

TOFAUTI calculates states from normalized raw components. Scores are internal diagnostics in the range `-100` to `100`; the product displays only directional state and `WEAK`, `MODERATE`, or `STRONG` strength. Scores are not probabilities.

## Order Flow

For each bucket:

```text
delta = aggressive_buy_volume - aggressive_sell_volume
buy_percentage = buy_volume / total_volume
sell_percentage = sell_volume / total_volume
```

The V0.1 `OrderFlowEngine` combines normalized latest delta, cumulative delta, volume acceleration, and the last three bucket directions. Each raw component is retained under `state.evidence` for explanation and later calibration.

## Structure

`StructureEngine` calculates a volume-weighted session reference, recent price change, session high/low, and a transparent starter level map: supply, demand, VWAP, prior-day high/low, and round number. Zones are explicit configured references in V0.1, not an opaque supply/demand model.

## Liquidity

A bearish buy-side sweep needs all of the following:

1. Recent price trades above marked supply.
2. Latest price returns below supply.
3. Order flow is bearish.

The resulting event stores level, excursion, return status, and delta after the sweep. The bullish rule mirrors this at demand. No liquidity conclusion is created if the evidence is absent.

## Macro

`MockMacroDataProvider` emits named Gold factors only for deterministic tests. In a live runtime, `MacroEngine` withholds direction unless each required Gold factor has a verified, current source: USD, real yields, risk sentiment, inflation, and central-bank demand. When all five are present, the engine averages the configured factor scores and retains every input score. The weights are tunable implementation choices, not claimed research.

## Alignment

Alignment considers macro, structure, order flow, and liquidity independently. Full alignment requires all four layers to agree. Neutral or opposing macro against matching structure/flow produces macro divergence. Conflicting flow against matching macro/structure produces order-flow divergence. Scores are averaged using symmetric half-away-from-zero rounding; strength thresholds are 30 and 60, direction thresholds are +/-12.

## War Room State Machine

The state machine can transition through `SCANNING`, `LEVEL_APPROACHING`, `LIQUIDITY_EVENT`, `PRESSURE_SHIFT`, `SETUP_FORMING`, `CONFIRMED`, and `IN_PLAY`. It only advances after engines supply matching evidence. It never manufactures an event merely because a scenario is selected.

## Setup Outcomes

A confirmed backend setup captures price, alignment and liquidity context, not a complete immutable entry snapshot. The runtime evaluates a path at the first received market tick at or after elapsed 5, 15, 30, and 60-minute horizons; it never treats a provider's tick count as elapsed time. Excursions are floored at zero. Target and invalidation flags describe whether each was touched anywhere in the observed horizon, not fill order or realized P/L. Full entry snapshots, intrabar sequencing and durable history retrieval remain required before performance statistics can be offered.

## Calculation Boundaries

Backend aggregation groups observations by UTC timestamp into 1m or 5m buckets. State scoring uses 1m observations; the dashboard shows 5m totals, including the latest incomplete bucket. Cumulative delta spans the retained engine session. The traded-volume profile uses normalized exchange ticks only and is not calculated from OHLC bars. `MBP-10` depth is displayed as a top-ten market-by-price ladder, not a market-by-order heatmap. Backend bars enclose open and close, and the displayed VWAP matches the calculated session reference. Supply, demand and prior-day levels are scenario fixtures in demo mode, not production detection algorithms.
