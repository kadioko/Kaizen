from __future__ import annotations

from datetime import datetime

from .models import Direction, Setup, SetupOutcome


def evaluate_setup_outcome(setup: Setup, prices: list[float], horizon_minutes: int, evaluated_at: datetime) -> SetupOutcome:
    """Evaluate observed path, not a forecast. Price samples come from the data repository later."""
    if not prices:
        raise ValueError("At least one observed price is required to evaluate a setup.")
    if setup.direction == Direction.BEARISH:
        favorable = [setup.entry_reference - price for price in prices]
        adverse = [price - setup.entry_reference for price in prices]
        target_hit = min(prices) <= setup.target1
        invalidation_hit = max(prices) >= setup.invalidation
    else:
        favorable = [price - setup.entry_reference for price in prices]
        adverse = [setup.entry_reference - price for price in prices]
        target_hit = max(prices) >= setup.target1
        invalidation_hit = min(prices) <= setup.invalidation
    return SetupOutcome(
        setup_id=setup.id,
        evaluated_at=evaluated_at,
        horizon_minutes=horizon_minutes,
        maximum_favorable_excursion=round(max(favorable), 2),
        maximum_adverse_excursion=round(max(adverse), 2),
        target_hit=target_hit,
        invalidation_hit=invalidation_hit,
        price_at_horizon=prices[-1],
    )
