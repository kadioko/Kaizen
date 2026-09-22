from datetime import UTC, datetime

import databento_dbn as dbn

from tofauti_market_engine.engines import AlignmentEngine, MacroEngine
from tofauti_market_engine.models import DataAvailability, Direction, LayerState, Strength
from tofauti_market_engine.providers import DatabentoMarketDataProvider, TradingEconomicsCalendarProvider, UnavailableMacroDataProvider


def mbp1_trade(*, price: int, size: int, bid: int, ask: int):
    return dbn.MBP1Msg(
        1,
        1,
        1_790_000_000_000_000_000,
        price,
        size,
        dbn.Action.TRADE,
        dbn.Side.ASK,
        0,
        1_790_000_000_000_000_000,
        levels=dbn.BidAskPair(bid_px=bid, ask_px=ask, bid_sz=1, ask_sz=1),
    )


def test_databento_adapter_preserves_bbo_basis_for_classified_trade():
    provider = DatabentoMarketDataProvider("test-key", "GC")
    tick = provider._record_to_tick(mbp1_trade(price=3_350_000_000_000, size=4, bid=3_349_900_000_000, ask=3_350_000_000_000))

    assert tick is not None
    assert tick.symbol == "GC"
    assert tick.raw_symbol == "GC.FUT"
    assert tick.price == 3350
    assert tick.aggressive_side == Direction.BULLISH
    assert tick.buy_volume == 4 and tick.sell_volume == 0 and tick.unknown_volume == 0
    assert "MBP-1" in tick.aggressor_side_source


def test_databento_adapter_never_forces_unmatched_trade_into_delta():
    provider = DatabentoMarketDataProvider("test-key", "MGC")
    tick = provider._record_to_tick(mbp1_trade(price=3_350_050_000_000, size=7, bid=3_349_900_000_000, ask=3_350_100_000_000))

    assert tick is not None
    assert tick.aggressive_side == Direction.NEUTRAL
    assert tick.buy_volume == 0 and tick.sell_volume == 0 and tick.unknown_volume == 7


def test_databento_adapter_rejects_unknown_schema_and_requires_a_parent_mapping():
    try:
        DatabentoMarketDataProvider("test-key", "NQ")
    except RuntimeError as exc:
        assert "parent symbol" in str(exc)
    else:  # pragma: no cover - protects the activation guard
        raise AssertionError("NQ must require an explicit validated parent symbol.")

    try:
        DatabentoMarketDataProvider("test-key", "GC", schema="mbo")
    except RuntimeError as exc:
        assert "mbp-1" in str(exc)
    else:  # pragma: no cover - protects the schema boundary
        raise AssertionError("MBO must not appear enabled without an order-book reconstructor.")


def test_calendar_provider_normalizes_actual_forecast_and_revisions():
    event = TradingEconomicsCalendarProvider._event({
        "CalendarId": "123",
        "Event": "Consumer Price Index",
        "Date": "2026-09-22T12:30:00Z",
        "Country": "United States",
        "Currency": "USD",
        "Importance": 3,
        "Actual": "0.3%",
        "Forecast": "0.2%",
        "Previous": "0.1%",
        "Revised": "0.2%",
        "Source": "U.S. Bureau of Labor Statistics",
    })

    assert event.id == "123"
    assert event.scheduled_at == datetime(2026, 9, 22, 12, 30, tzinfo=UTC)
    assert event.actual == "0.3%" and event.forecast == "0.2%" and event.revised == "0.2%"
    assert event.expected_volatility_impact == "HIGH"
    assert "Direction is not inferred" in event.impact_basis


def test_unavailable_macro_cannot_be_presented_as_full_alignment():
    macro = MacroEngine().build([])
    bearish = LayerState(direction=Direction.BEARISH, score=-50, strength=Strength.MODERATE, summary="verified")
    alignment = AlignmentEngine().build(macro, bearish, bearish, bearish)

    assert macro.availability == DataAvailability.UNAVAILABLE
    assert alignment.state == "INCOMPLETE_BEARISH_ALIGNMENT"
    assert "macro" in alignment.evidence["unavailable_layers"]
