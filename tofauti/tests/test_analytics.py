import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps" / "api"))
from app.analytics import observed_setup_analytics  # noqa: E402


def test_observed_analytics_reports_measurements_without_inventing_probability():
    analytics = observed_setup_analytics([
        {"horizon_minutes": 5, "mfe": 12.5, "mae": 2.0, "target_hit": True, "invalidation_hit": False},
        {"horizon_minutes": 5, "mfe": 3.0, "mae": 8.0, "target_hit": False, "invalidation_hit": True},
        {"horizon_minutes": 15, "mfe": 5.0, "mae": 5.0, "target_hit": True, "invalidation_hit": True},
    ])

    five_minutes = next(item for item in analytics["horizons"] if item["horizon_minutes"] == 5)
    fifteen_minutes = next(item for item in analytics["horizons"] if item["horizon_minutes"] == 15)
    assert analytics["availability"] == "AVAILABLE"
    assert analytics["observed_outcomes"] == 3
    assert five_minutes == {
        "horizon_minutes": 5,
        "observations": 2,
        "target_hits": 1,
        "invalidation_hits": 1,
        "ambiguous_paths": 0,
        "unresolved_paths": 0,
        "average_mfe": 7.75,
        "average_mae": 5.0,
    }
    assert fifteen_minutes["ambiguous_paths"] == 1
    assert "probability" in analytics["boundary"]


def test_observed_analytics_waits_for_recorded_outcomes():
    analytics = observed_setup_analytics([])

    assert analytics["availability"] == "AWAITING_OBSERVATIONS"
    assert analytics["observed_outcomes"] == 0
