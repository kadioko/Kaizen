from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable, Mapping
from statistics import fmean
from typing import Any


SUPPORTED_HORIZONS = (5, 15, 30, 60)


def observed_setup_analytics(rows: Iterable[Mapping[str, Any]]) -> dict[str, object]:
    """Summarize recorded outcomes without converting observations into forecasts."""

    groups: dict[int, list[Mapping[str, Any]]] = defaultdict(list)
    for row in rows:
        horizon = row.get("horizon_minutes")
        if isinstance(horizon, int) and horizon in SUPPORTED_HORIZONS:
            groups[horizon].append(row)

    summaries = []
    for horizon in SUPPORTED_HORIZONS:
        observations = groups[horizon]
        target_hits = sum(row.get("target_hit") is True for row in observations)
        invalidations = sum(row.get("invalidation_hit") is True for row in observations)
        ambiguous = sum(row.get("target_hit") is True and row.get("invalidation_hit") is True for row in observations)
        resolved = sum(
            (row.get("target_hit") is True) ^ (row.get("invalidation_hit") is True)
            for row in observations
        )
        summaries.append({
            "horizon_minutes": horizon,
            "observations": len(observations),
            "target_hits": target_hits,
            "invalidation_hits": invalidations,
            "ambiguous_paths": ambiguous,
            "unresolved_paths": len(observations) - resolved - ambiguous,
            "average_mfe": round(fmean(float(row["mfe"]) for row in observations), 4) if observations else None,
            "average_mae": round(fmean(float(row["mae"]) for row in observations), 4) if observations else None,
        })

    total = sum(summary["observations"] for summary in summaries)
    return {
        "availability": "AVAILABLE" if total else "AWAITING_OBSERVATIONS",
        "observed_outcomes": total,
        "horizons": summaries,
        "boundary": "These are recorded path observations, not a win-rate forecast, probability, or trade recommendation.",
    }
