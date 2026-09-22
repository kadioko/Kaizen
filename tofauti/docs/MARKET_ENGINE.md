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

`MockMacroDataProvider` emits named Gold factors: USD, real yields, risk sentiment, inflation, and central-bank demand. Weights are intentionally heuristic V0.1 configuration, not claimed research. `MacroEngine` averages the factor scores and retains every input score.

## Alignment

Alignment considers macro, structure, order flow, and liquidity independently. Full alignment requires all four layers to agree. Neutral or opposing macro against matching structure/flow produces macro divergence. Conflicting flow against matching macro/structure produces order-flow divergence. Scores are averaged using symmetric half-away-from-zero rounding; strength thresholds are 30 and 60, direction thresholds are +/-12.

## War Room State Machine

The state machine can transition through `SCANNING`, `LEVEL_APPROACHING`, `LIQUIDITY_EVENT`, `PRESSURE_SHIFT`, `SETUP_FORMING`, `CONFIRMED`, and `IN_PLAY`. It only advances after engines supply matching evidence. It never manufactures an event merely because a scenario is selected.

## Setup Outcomes

A confirmed backend setup currently captures price, alignment and liquidity context, not a complete immutable entry snapshot. In demo mode every future tick equals one simulated minute; the runtime evaluates observed price paths at 5, 15, 30, and 60 simulated minutes. Excursions are floored at zero. Target and invalidation flags describe whether each was touched anywhere in the observation horizon, not fill order or realized P/L. Full entry snapshots, intrabar sequencing and durable history retrieval remain required before performance statistics can be offered.

## Calculation Boundaries

Backend aggregation groups observations by UTC timestamp into 1m or 5m buckets. State scoring uses 1m observations; the dashboard shows 5m totals, including the latest incomplete bucket. Cumulative delta spans the retained simulated session. Backend bars enclose open and close, and the displayed VWAP matches the calculated session reference. Supply, demand and prior-day levels are scenario fixtures, not production detection algorithms.

The browser fallback has its own deterministic engine and synthetic volume inputs. Its scores are not numerically identical to Python. Both implementations test arithmetic invariants and full-alignment requirements. Unifying the runtime or adding cross-language parity fixtures is a release requirement before vendor integration.
