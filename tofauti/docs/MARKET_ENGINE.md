# Market Engine

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

Alignment considers macro, structure, order flow, and liquidity independently. Three or more agreeing directional layers with macro agreement produces full alignment; disagreement is surfaced as partial alignment, macro divergence, mixed, or neutral.

## War Room State Machine

The state machine can transition through `SCANNING`, `LEVEL_APPROACHING`, `LIQUIDITY_EVENT`, `PRESSURE_SHIFT`, `SETUP_FORMING`, `CONFIRMED`, and `IN_PLAY`. It only advances after engines supply matching evidence. It never manufactures an event merely because a scenario is selected.

## Setup Outcomes

A confirmed setup captures the full calculated snapshot. In demo mode every future tick equals one simulated minute; the runtime evaluates observed price paths at 5, 15, 30, and 60 simulated minutes, recording MFE, MAE, target hit, invalidation hit, and price at each horizon. This is outcome measurement, not a forecast.
