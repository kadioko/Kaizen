from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from math import copysign, floor

from .models import (
    AlignmentState,
    DemoScenario,
    Direction,
    LayerState,
    LiquidityEvent,
    MacroState,
    MarketLevel,
    MarketTick,
    OHLCVBar,
    OrderFlowBucket,
    OrderFlowState,
    LiquidityState,
    StructureState,
    Strength,
)


def clamp_score(value: float) -> int:
    bounded = max(-100, min(100, value))
    return int(copysign(floor(abs(bounded) + 0.5), bounded))


def strength_for(score: int) -> Strength:
    magnitude = abs(score)
    if magnitude >= 60:
        return Strength.STRONG
    if magnitude >= 30:
        return Strength.MODERATE
    return Strength.WEAK


def direction_for(score: int, threshold: int = 12) -> Direction:
    if score >= threshold:
        return Direction.BULLISH
    if score <= -threshold:
        return Direction.BEARISH
    return Direction.NEUTRAL


class OrderFlowEngine:
    """Explainable V0.1 flow model. Coefficients live here for later calibration."""

    def build(self, ticks: list[MarketTick], timeframe_minutes: int = 1) -> tuple[list[OrderFlowBucket], LayerState]:
        if timeframe_minutes not in {1, 5}:
            raise ValueError("Only 1m and 5m buckets are supported.")
        groups = defaultdict(list)
        for tick in sorted(ticks, key=lambda item: item.timestamp):
            if tick.volume < 0 or min(tick.buy_volume, tick.sell_volume) < 0 or tick.volume != tick.buy_volume + tick.sell_volume:
                raise ValueError("Tick volume must equal nonnegative buy plus sell volume.")
            start = int(tick.timestamp.timestamp()) // (timeframe_minutes * 60) * (timeframe_minutes * 60)
            groups[start].append(tick)
        if not groups:
            return [], OrderFlowState(direction=Direction.NEUTRAL, score=0, strength=Strength.WEAK, summary="Waiting for market activity.")
        cumulative = 0
        buckets = []
        previous_delta = None
        previous_volume = None
        for start, group in sorted(groups.items()):
            buy = sum(tick.buy_volume for tick in group)
            sell = sum(tick.sell_volume for tick in group)
            volume = buy + sell
            delta = buy - sell
            cumulative += delta
            buckets.append(OrderFlowBucket(
                start=datetime.fromtimestamp(start, UTC), timeframe=f"{timeframe_minutes}m",
                buy_volume=buy, sell_volume=sell, total_volume=volume, delta=delta,
                delta_change=delta - previous_delta if previous_delta is not None else 0,
                cumulative_delta=cumulative,
                buy_percentage=round(buy / volume * 100, 1) if volume else 0,
                sell_percentage=round(sell / volume * 100, 1) if volume else 0,
                volume_acceleration=round((volume / previous_volume - 1) * 100, 1) if previous_volume else 0,
            ))
            previous_delta, previous_volume = delta, volume
        recent = buckets[-8:]
        deltas = [bucket.delta for bucket in recent]
        volumes = [bucket.total_volume for bucket in recent]
        latest = buckets[-1]
        average_abs_delta = sum(abs(value) for value in deltas) / len(deltas)
        delta_component = latest.delta / max(average_abs_delta, 1) * 35
        cumulative_component = sum(deltas) / max(sum(volumes), 1) * 70
        acceleration_component = latest.volume_acceleration * copysign(0.16, latest.delta or 1)
        sequence_component = sum(1 if value > 0 else -1 if value < 0 else 0 for value in deltas[-3:]) * 7
        score = clamp_score(delta_component + cumulative_component + acceleration_component + sequence_component)
        direction = direction_for(score)
        return buckets, OrderFlowState(
            direction=direction,
            score=score,
            strength=strength_for(score),
            summary=f"{direction.value.title()} pressure from delta, cumulative delta, volume acceleration, and the recent bucket sequence.",
            evidence={
                "latest_delta": latest.delta,
                "delta_change": latest.delta_change,
                "cumulative_delta": latest.cumulative_delta,
                "buy_percentage": latest.buy_percentage,
                "sell_percentage": latest.sell_percentage,
                "volume_acceleration": latest.volume_acceleration,
                "recent_deltas": deltas[-3:],
            },
        )


class StructureEngine:
    def __init__(self) -> None:
        self.levels = [
            MarketLevel(id="gc-supply", type="Supply", price=3351.0, strength=Strength.STRONG, touches=3),
            MarketLevel(id="gc-vwap", type="VWAP", price=3347.5, strength=Strength.MODERATE, touches=2),
            MarketLevel(id="gc-demand", type="Demand", price=3343.5, strength=Strength.STRONG, touches=2),
            MarketLevel(id="gc-pdh", type="Previous day high", price=3350.5, strength=Strength.MODERATE, touches=1),
            MarketLevel(id="gc-pdl", type="Previous day low", price=3338.0, strength=Strength.MODERATE, touches=1),
            MarketLevel(id="gc-round", type="Round number", price=3350.0, strength=Strength.WEAK, touches=4),
        ]

    def build(self, ticks: list[MarketTick]) -> tuple[LayerState, list[MarketLevel], list[OHLCVBar]]:
        recent = ticks
        if not recent:
            return StructureState(direction=Direction.NEUTRAL, score=0, strength=Strength.WEAK, summary="Waiting for enough ticks to map structure."), self.levels, []
        weighted_price = sum(tick.price * tick.volume for tick in recent) / max(sum(tick.volume for tick in recent), 1)
        latest = recent[-1]
        price_change = latest.price - recent[0].price
        vwap_distance = latest.price - weighted_price
        score = clamp_score(price_change * 22 + vwap_distance * 18)
        direction = direction_for(score)
        for level in self.levels:
            if level.type == "VWAP":
                level.price = round(weighted_price, 2)
            if abs(level.price - latest.price) <= 0.35:
                level.last_interaction = latest.timestamp
        bars = [
            OHLCVBar(
                time=int(tick.timestamp.timestamp()),
                open=recent[index - 1].price if index else tick.price,
                high=max(tick.ask, tick.price, recent[index - 1].price if index else tick.price),
                low=min(tick.bid, tick.price, recent[index - 1].price if index else tick.price),
                close=tick.price,
                volume=tick.volume,
            )
            for index, tick in enumerate(recent)
        ]
        return StructureState(
            direction=direction,
            score=score,
            strength=strength_for(score),
            summary=f"Price is {abs(vwap_distance):.1f} points {'above' if vwap_distance >= 0 else 'below'} session VWAP with a {price_change:+.1f}-point recent move.",
            evidence={"vwap": round(weighted_price, 2), "recent_change": round(price_change, 2), "session_high": max(t.price for t in recent), "session_low": min(t.price for t in recent)},
        ), self.levels, bars


class LiquidityEngine:
    def build(self, ticks: list[MarketTick], flow: LayerState) -> tuple[LayerState, list[LiquidityEvent]]:
        recent = ticks
        if len(recent) < 3:
            return LiquidityState(direction=Direction.NEUTRAL, score=0, strength=Strength.WEAK, summary="Waiting for a level interaction."), []
        supply = 3351.0
        demand = 3343.5
        latest = recent[-1]
        max_price = max(tick.price for tick in recent)
        min_price = min(tick.price for tick in recent)
        events: list[LiquidityEvent] = []
        if max_price > supply and latest.price < supply and flow.direction == Direction.BEARISH:
            evidence = {"level": supply, "max_excursion": round(max_price - supply, 2), "returned_inside": True, "delta_after_sweep": flow.evidence.get("latest_delta", 0)}
            events.append(LiquidityEvent(id=f"sweep-{int(latest.timestamp.timestamp())}", timestamp=latest.timestamp, kind="BUY_SIDE_LIQUIDITY_SWEPT", direction=Direction.BEARISH, level=supply, evidence=evidence))
            return LiquidityState(direction=Direction.BEARISH, score=-72, strength=Strength.STRONG, summary="Buy-side liquidity was swept above supply, then price returned inside with seller pressure.", evidence=evidence), events
        if min_price < demand and latest.price > demand and flow.direction == Direction.BULLISH:
            evidence = {"level": demand, "max_excursion": round(demand - min_price, 2), "returned_inside": True, "delta_after_sweep": flow.evidence.get("latest_delta", 0)}
            events.append(LiquidityEvent(id=f"sweep-{int(latest.timestamp.timestamp())}", timestamp=latest.timestamp, kind="SELL_SIDE_LIQUIDITY_SWEPT", direction=Direction.BULLISH, level=demand, evidence=evidence))
            return LiquidityState(direction=Direction.BULLISH, score=72, strength=Strength.STRONG, summary="Sell-side liquidity was swept below demand, then price returned inside with buyer pressure.", evidence=evidence), events
        distance = min(abs(latest.price - supply), abs(latest.price - demand))
        return LiquidityState(direction=Direction.NEUTRAL, score=0, strength=Strength.WEAK, summary=f"No completed liquidity sweep. Nearest marked liquidity reference is {distance:.1f} points away.", evidence={"nearest_distance": round(distance, 2)}), events


class MacroEngine:
    def build(self, factors) -> MacroState:
        score = clamp_score(sum(factor.score for factor in factors) / len(factors)) if factors else 0
        direction = direction_for(score)
        return MacroState(direction=direction, score=score, strength=strength_for(score), summary=f"Mock macro basket is {direction.value.lower()} from configured USD, real-yield, sentiment, inflation, and central-bank factors.", evidence={"factor_scores": {factor.name: factor.score for factor in factors}}, factors=factors)


class AlignmentEngine:
    def build(self, macro: LayerState, structure: LayerState, flow: LayerState, liquidity: LayerState) -> AlignmentState:
        scores = [macro.score, structure.score, flow.score, liquidity.score]
        average = clamp_score(sum(scores) / len(scores))
        bearish = sum(score <= -12 for score in scores)
        bullish = sum(score >= 12 for score in scores)
        if bearish == 4:
            state = "FULL_BEARISH_ALIGNMENT"
        elif bullish == 4:
            state = "FULL_BULLISH_ALIGNMENT"
        elif structure.direction != Direction.NEUTRAL and structure.direction == flow.direction and macro.direction != structure.direction:
            state = "MACRO_DIVERGENCE"
        elif structure.direction != Direction.NEUTRAL and macro.direction == structure.direction and flow.direction != structure.direction:
            state = "ORDERFLOW_DIVERGENCE"
        elif bearish >= 2 and bullish >= 2:
            state = "MIXED"
        elif bearish >= 2:
            state = "PARTIAL_BEARISH_ALIGNMENT"
        elif bullish >= 2:
            state = "PARTIAL_BULLISH_ALIGNMENT"
        else:
            state = "MIXED" if any(scores) else "NEUTRAL"
        return AlignmentState(direction=direction_for(average), score=average, strength=strength_for(average), state=state, summary=f"{state.replace('_', ' ').title()} based on the four calculated layers.", evidence={"macro": macro.score, "structure": structure.score, "order_flow": flow.score, "liquidity": liquidity.score})
