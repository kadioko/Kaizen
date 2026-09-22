from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import httpx

from tofauti_market_engine.models import (
    EconomicCalendarEvent,
    Instrument,
    LiquidityEvent,
    MacroState,
    MarketLevel,
    MarketSnapshot,
    MarketTick,
    OHLCVBar,
    OrderFlowBucket,
    Setup,
    SetupOutcome,
    WarRoomEvent,
)


class SupabaseRepository:
    """Server-only PostgREST repository. Never expose the service role to Next.js."""

    def __init__(self, url: str, service_role_key: str) -> None:
        self._url = url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(10.0))
        self._headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
        }

    async def close(self) -> None:
        await self._client.aclose()

    async def initialize(self, instruments: list[Instrument]) -> None:
        await self._upsert("tofauti_instruments", [
            {
                "symbol": item.symbol,
                "name": item.name,
                "asset_class": item.asset_class,
                "tick_size": item.tick_size,
                "point_value": item.point_value,
                "exchange": item.exchange,
                "enabled": item.enabled,
            }
            for item in instruments
        ], "symbol")

    async def persist(
        self,
        *,
        tick: MarketTick,
        snapshot: MarketSnapshot,
        bars: list[OHLCVBar],
        buckets: list[OrderFlowBucket],
        levels: list[MarketLevel],
        liquidity_events: list[LiquidityEvent],
        macro: MacroState,
        events: list[WarRoomEvent],
        setup: Setup | None,
        outcomes: list[SetupOutcome],
    ) -> None:
        await self._upsert("tofauti_market_ticks", [{
            "symbol": tick.symbol, "timestamp": tick.timestamp.isoformat(), "price": tick.price,
            "bid": tick.bid, "ask": tick.ask, "volume": tick.volume, "buy_volume": tick.buy_volume,
            "sell_volume": tick.sell_volume, "unknown_volume": tick.unknown_volume,
            "aggressive_side": tick.aggressive_side.value, "source": tick.source,
            "raw_symbol": tick.raw_symbol, "aggressor_side_source": tick.aggressor_side_source,
        }], "symbol,timestamp")
        await self._upsert("tofauti_bars", [{
            "symbol": snapshot.instrument.symbol, "timeframe": "1m",
            "timestamp": datetime.fromtimestamp(bar.time, UTC).isoformat(),
            "open": bar.open, "high": bar.high, "low": bar.low, "close": bar.close, "volume": bar.volume,
        } for bar in bars], "symbol,timeframe,timestamp")
        await self._upsert("tofauti_orderflow_buckets", [{
            "symbol": snapshot.instrument.symbol, "timeframe": bucket.timeframe, "timestamp": bucket.start.isoformat(),
            "buy_volume": bucket.buy_volume, "sell_volume": bucket.sell_volume, "unknown_volume": bucket.unknown_volume, "total_volume": bucket.total_volume,
            "delta": bucket.delta, "delta_change": bucket.delta_change, "cumulative_delta": bucket.cumulative_delta,
            "buy_percentage": bucket.buy_percentage, "sell_percentage": bucket.sell_percentage,
            "volume_acceleration": bucket.volume_acceleration,
        } for bucket in buckets], "symbol,timeframe,timestamp")
        await self._upsert("tofauti_levels", [{
            "id": level.id, "symbol": snapshot.instrument.symbol, "level_type": level.type, "price": level.price,
            "strength": level.strength.value, "touches": level.touches,
            "last_interaction": level.last_interaction.isoformat() if level.last_interaction else None,
            "updated_at": snapshot.timestamp.isoformat(),
        } for level in levels], "id")
        if liquidity_events:
            await self._upsert("tofauti_liquidity_events", [{
                "id": event.id, "symbol": snapshot.instrument.symbol, "timestamp": event.timestamp.isoformat(),
                "event_type": event.kind, "direction": event.direction.value, "level": event.level, "evidence": event.evidence,
            } for event in liquidity_events], "id")
        await self._insert("tofauti_macro_states", [{
            "symbol": snapshot.instrument.symbol, "timestamp": snapshot.timestamp.isoformat(), "score": macro.score,
            "direction": macro.direction.value, "strength": macro.strength.value,
            "availability": macro.availability.value, "factors": [factor.model_dump(mode="json") for factor in macro.factors],
        }])
        await self._insert("tofauti_market_snapshots", [{
            "symbol": snapshot.instrument.symbol, "timestamp": snapshot.timestamp.isoformat(),
            "war_room_state": snapshot.war_room_state.value, "scenario": snapshot.scenario.value if snapshot.scenario else None,
            "payload": snapshot.model_dump(mode="json"),
        }])
        if events:
            await self._upsert("tofauti_war_room_events", [{
                "id": event.id, "symbol": snapshot.instrument.symbol, "timestamp": event.timestamp.isoformat(),
                "category": event.category, "severity": event.severity, "title": event.title,
                "description": event.description, "evidence": event.evidence,
                "state_before": event.state_before.value, "state_after": event.state_after.value,
            } for event in events], "id")
        if setup:
            await self._upsert("tofauti_setups", [{
                "id": setup.id, "symbol": setup.instrument, "timestamp": setup.timestamp.isoformat(),
                "direction": setup.direction.value, "entry_reference": setup.entry_reference,
                "invalidation": setup.invalidation, "target1": setup.target1, "target2": setup.target2,
                "alignment_state": setup.alignment_state, "macro_score": setup.macro_score,
                "structure_score": setup.structure_score, "orderflow_score": setup.orderflow_score,
                "liquidity_score": setup.liquidity_score, "status": setup.status,
                "snapshot": setup.snapshot,
            }], "id")
        if outcomes:
            await self._upsert("tofauti_setup_outcomes", [{
                "setup_id": outcome.setup_id, "evaluated_at": outcome.evaluated_at.isoformat(),
                "horizon_minutes": outcome.horizon_minutes, "mfe": outcome.maximum_favorable_excursion,
                "mae": outcome.maximum_adverse_excursion, "target_hit": outcome.target_hit,
                "invalidation_hit": outcome.invalidation_hit, "price_at_horizon": outcome.price_at_horizon,
            } for outcome in outcomes], "setup_id,horizon_minutes")

    async def persist_calendar_events(self, events: list[EconomicCalendarEvent]) -> None:
        await self._upsert("tofauti_calendar_events", [{
            "id": event.id,
            "scheduled_at": event.scheduled_at.isoformat(),
            "country": event.country,
            "currency": event.currency,
            "title": event.title,
            "importance": event.importance,
            "actual": event.actual,
            "forecast": event.forecast,
            "previous": event.previous,
            "revised": event.revised,
            "source": event.source,
            "source_url": event.source_url,
            "payload": event.model_dump(mode="json"),
        } for event in events], "id")

    async def _insert(self, table: str, rows: list[dict[str, Any]]) -> None:
        if not rows:
            return
        response = await self._client.post(f"{self._url}/rest/v1/{table}", headers={**self._headers, "Prefer": "return=minimal"}, json=rows)
        response.raise_for_status()

    async def _upsert(self, table: str, rows: list[dict[str, Any]], conflict: str) -> None:
        if not rows:
            return
        response = await self._client.post(
            f"{self._url}/rest/v1/{table}", params={"on_conflict": conflict},
            headers={**self._headers, "Prefer": "resolution=merge-duplicates,return=minimal"}, json=rows,
        )
        response.raise_for_status()
