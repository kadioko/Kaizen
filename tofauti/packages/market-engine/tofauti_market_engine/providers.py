from __future__ import annotations

import asyncio
import logging
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from random import Random
from typing import Any

import httpx

from .models import DemoScenario, DepthLevel, Direction, EconomicCalendarEvent, MacroFactor, MarketTick

logger = logging.getLogger(__name__)


class ProviderConfigurationError(RuntimeError):
    """Raised when a live provider cannot be enabled truthfully."""


class MarketDataProvider(ABC):
    """Normalized provider boundary. Future vendors must emit MarketTick, not vendor DTOs."""

    @abstractmethod
    async def connect(self) -> None: ...

    @abstractmethod
    async def disconnect(self) -> None: ...

    @abstractmethod
    async def subscribe(self, symbol: str) -> None: ...

    @abstractmethod
    async def trades(self, symbol: str) -> AsyncIterator[MarketTick]: ...

    @abstractmethod
    async def quotes(self, symbol: str) -> AsyncIterator[MarketTick]: ...

    @abstractmethod
    async def historical(self, symbol: str, start: datetime, end: datetime) -> list[MarketTick]: ...

    @abstractmethod
    def source_metadata(self) -> dict[str, str]: ...


class MacroDataProvider(ABC):
    @abstractmethod
    async def current_factors(self) -> list[MacroFactor]: ...


class EconomicCalendarProvider(ABC):
    @abstractmethod
    async def upcoming(self, start: datetime, end: datetime, countries: tuple[str, ...]) -> list[EconomicCalendarEvent]: ...

    @abstractmethod
    async def close(self) -> None: ...

    @abstractmethod
    def source_metadata(self) -> dict[str, str]: ...


class MockMarketDataProvider(MarketDataProvider):
    """Deterministic GC/MGC demo feed. One emitted tick represents one simulated minute."""

    _SCENARIOS: dict[DemoScenario, list[tuple[float, int, int]]] = {
        DemoScenario.BEARISH_LIQUIDITY_SWEEP: [
            (3347.8, 390, 350), (3348.9, 450, 390), (3350.2, 610, 490),
            (3352.3, 820, 530), (3351.4, 480, 760), (3349.8, 410, 920),
            (3348.4, 360, 1050), (3347.0, 330, 1120), (3345.8, 350, 980),
            (3344.7, 310, 900), (3343.9, 300, 760),
        ],
        DemoScenario.BULLISH_REVERSAL: [
            (3347.0, 350, 420), (3345.9, 480, 710), (3344.7, 500, 860),
            (3343.2, 550, 920), (3344.9, 810, 530), (3346.1, 940, 430),
            (3347.5, 1080, 380), (3348.8, 980, 350), (3350.0, 820, 370),
        ],
        DemoScenario.MIXED: [
            (3348.0, 520, 500), (3348.4, 540, 510), (3347.9, 505, 525),
            (3348.2, 510, 505), (3348.1, 490, 500), (3348.3, 520, 515),
        ],
        DemoScenario.MACRO_DIVERGENCE: [
            (3348.0, 530, 470), (3349.0, 670, 410), (3350.0, 760, 390),
            (3351.0, 800, 420), (3351.5, 720, 500), (3350.8, 590, 570),
        ],
        DemoScenario.FULL_ALIGNMENT: [
            (3349.4, 610, 470), (3350.5, 700, 520), (3351.7, 790, 510),
            (3350.8, 420, 820), (3349.2, 380, 990), (3347.8, 340, 1090),
            (3346.2, 310, 1120), (3344.8, 300, 980), (3343.6, 290, 840),
        ],
    }

    def __init__(self, scenario: DemoScenario = DemoScenario.BEARISH_LIQUIDITY_SWEEP, seed: int = 42, start: datetime | None = None) -> None:
        self.scenario = scenario
        self._index = 0
        self._rng = Random(seed)
        self._seed = seed
        self._connected = False
        self._start = (start or datetime.now(UTC)).replace(second=0, microsecond=0)
        self.cycle_started = False

    async def connect(self) -> None:
        self._connected = True

    async def disconnect(self) -> None:
        self._connected = False

    async def subscribe(self, _symbol: str) -> None:
        if not self._connected:
            raise RuntimeError("Provider must connect before subscription.")

    def set_scenario(self, scenario: DemoScenario) -> None:
        self.scenario = scenario
        self._index = 0
        self._rng = Random(self._seed)
        self._start += timedelta(minutes=75)
        self.cycle_started = False

    def next_tick(self, symbol: str = "GC") -> MarketTick:
        if self._index >= 75:
            self._index = 0
            self._start += timedelta(minutes=75)
            self._rng = Random(self._seed)
            self.cycle_started = True
        else:
            self.cycle_started = False
        path = self._SCENARIOS[self.scenario]
        if self._index < len(path):
            price, buy_volume, sell_volume = path[self._index]
        else:
            # Continue the established demo direction instead of looping back to
            # the opening condition after a state machine has confirmed a setup.
            extension = self._index - len(path) + 1
            terminal_price, buy_volume, sell_volume = path[-1]
            sign = -1 if self.scenario in {DemoScenario.BEARISH_LIQUIDITY_SWEEP, DemoScenario.FULL_ALIGNMENT} else 1 if self.scenario == DemoScenario.BULLISH_REVERSAL else 0
            price = terminal_price + sign * extension * 0.15
            if sign < 0:
                buy_volume, sell_volume = 300, 780
            elif sign > 0:
                buy_volume, sell_volume = 780, 300
        jitter = self._rng.choice((-0.1, 0.0, 0.0, 0.1))
        timestamp = self._start + timedelta(minutes=self._index)
        self._index += 1
        price = round(price + jitter, 1)
        return MarketTick(
            timestamp=timestamp,
            symbol=symbol,
            price=price,
            bid=round(price - 0.1, 1),
            ask=round(price + 0.1, 1),
            volume=buy_volume + sell_volume,
            aggressive_side=Direction.BULLISH if buy_volume >= sell_volume else Direction.BEARISH,
            buy_volume=buy_volume,
            sell_volume=sell_volume,
        )

    async def trades(self, symbol: str) -> AsyncIterator[MarketTick]:
        while self._connected:
            # Keep the deterministic source realistic enough for WebSocket tests
            # without turning the local worker into a CPU-bound loop.
            await asyncio.sleep(0.85)
            yield self.next_tick(symbol)

    async def quotes(self, symbol: str) -> AsyncIterator[MarketTick]:
        async for tick in self.trades(symbol):
            yield tick

    async def historical(self, symbol: str, start: datetime, end: datetime) -> list[MarketTick]:
        if start.tzinfo is None or end.tzinfo is None or end < start:
            raise ValueError("Historical range requires ordered timezone-aware timestamps.")
        clone = MockMarketDataProvider(self.scenario, seed=self._seed, start=start)
        result: list[MarketTick] = []
        for _ in range(min(250, int((end - start).total_seconds() // 60) + 2)):
            tick = clone.next_tick(symbol)
            if start <= tick.timestamp <= end:
                result.append(tick)
        return result

    def source_metadata(self) -> dict[str, str]:
        return {"mode": "simulated", "provider": "MockMarketDataProvider", "clock": "simulated"}


class MockMacroDataProvider(MacroDataProvider):
    def __init__(self, scenario: DemoScenario = DemoScenario.BEARISH_LIQUIDITY_SWEEP) -> None:
        self.scenario = scenario

    def set_scenario(self, scenario: DemoScenario) -> None:
        self.scenario = scenario

    async def current_factors(self, scenario: DemoScenario | None = None) -> list[MacroFactor]:
        scenario = scenario or self.scenario
        now = datetime.now(UTC)
        bearish = scenario in {DemoScenario.BEARISH_LIQUIDITY_SWEEP, DemoScenario.FULL_ALIGNMENT}
        divergence = scenario == DemoScenario.MACRO_DIVERGENCE
        inputs = [
            ("USD", "STRENGTHENING" if bearish else "SOFTENING", -42 if bearish else 30),
            ("Real yields", "RISING" if bearish else "EASING", -35 if bearish else 26),
            ("Risk sentiment", "RISK-ON" if bearish else "CAUTIOUS", -18 if bearish else 18),
            ("Inflation", "STABLE", 5),
            ("Central-bank demand", "STEADY", 8),
        ]
        if divergence:
            inputs[0] = ("USD", "STRENGTHENING", -48)
            inputs[1] = ("Real yields", "RISING", -38)
            inputs[2] = ("Risk sentiment", "RISK-ON", -20)
        if scenario == DemoScenario.MIXED:
            inputs = [(name, "STABLE", 0) for name, _, _ in inputs]
        return [
            MacroFactor(
                name=name,
                current_state=state,
                directional_effect=Direction.BULLISH if score > 0 else Direction.BEARISH if score < 0 else Direction.NEUTRAL,
                score=score,
                updated_at=now,
                source="Mock macro provider",
            )
            for name, state, score in inputs
        ]


class UnavailableMacroDataProvider(MacroDataProvider):
    """Explicitly withholds macro direction until every required input is licensed."""

    async def current_factors(self) -> list[MacroFactor]:
        return []


@dataclass(frozen=True)
class DatabentoSubscription:
    symbol: str
    parent_symbol: str


class DatabentoMarketDataProvider(MarketDataProvider):
    """Normalizes entitled CME Globex market-by-price records without vendor DTOs.

    A provider instance is intentionally bound to one TOFAUTI instrument. That
    makes contract attribution deterministic while the service operates GC and
    MGC as independent runtimes. A shared multiplexing session can be added
    later without changing MarketTick or any analytics engine.
    """

    DATASET = "GLBX.MDP3"
    _PARENT_SYMBOLS = {"GC": "GC.FUT", "MGC": "MGC.FUT"}
    _SUPPORTED_SCHEMAS = frozenset({"mbp-1", "mbp-10"})

    def __init__(self, api_key: str, symbol: str, dataset: str = DATASET, schema: str = "mbp-1", parent_symbol: str | None = None) -> None:
        if not api_key.strip():
            raise ProviderConfigurationError("DATABENTO_API_KEY is required for a live CME feed.")
        schema = schema.strip().lower()
        if schema not in self._SUPPORTED_SCHEMAS:
            supported = ", ".join(sorted(self._SUPPORTED_SCHEMAS))
            raise ProviderConfigurationError(f"Databento schema must be one of: {supported}.")
        parent_symbol = parent_symbol or self._PARENT_SYMBOLS.get(symbol)
        if not parent_symbol:
            raise ProviderConfigurationError(f"{symbol} requires a validated Databento parent symbol before it can be enabled.")
        self._api_key = api_key
        self._subscription = DatabentoSubscription(symbol=symbol, parent_symbol=parent_symbol)
        self._dataset = dataset
        self._schema = schema
        self._client: Any | None = None
        self._loop: asyncio.AbstractEventLoop | None = None
        self._queue: asyncio.Queue[MarketTick] = asyncio.Queue(maxsize=10_000)
        self._connected = False
        self._started = False
        self._last_quote: tuple[float, float] | None = None
        self._last_event_at: datetime | None = None
        self._last_reconnect_gap: str | None = None
        self._last_error: str | None = None

    async def connect(self) -> None:
        if self._connected:
            return
        try:
            import databento as db
        except ImportError as exc:  # pragma: no cover - exercised in deployment configuration
            raise ProviderConfigurationError("Install the databento package before enabling MARKET_DATA_PROVIDER=databento.") from exc
        self._loop = asyncio.get_running_loop()
        self._client = db.Live(
            key=self._api_key,
            heartbeat_interval_s=30,
            reconnect_policy="reconnect",
            loop=self._loop,
        )
        self._client.add_callback(self._on_record, self._on_callback_error)
        self._client.add_reconnect_callback(self._on_reconnect, self._on_callback_error)
        self._connected = True

    async def disconnect(self) -> None:
        if not self._connected:
            return
        client, self._client = self._client, None
        self._connected = False
        self._started = False
        if client is not None:
            stop = getattr(client, "stop", None) or getattr(client, "terminate", None)
            if stop is not None:
                await asyncio.to_thread(stop)

    async def subscribe(self, symbol: str) -> None:
        if not self._connected or self._client is None:
            raise RuntimeError("Provider must connect before subscription.")
        if symbol != self._subscription.symbol:
            raise ProviderConfigurationError(f"This Databento provider instance is bound to {self._subscription.symbol}, not {symbol}.")
        if not self._started:
            # Market-by-price records contain trades and best-book updates.
            # Delta uses only trades classified against the latest BBO.
            self._client.subscribe(
                dataset=self._dataset,
                schema=self._schema,
                stype_in="parent",
                symbols=self._subscription.parent_symbol,
            )
            self._client.start()
            self._started = True

    async def trades(self, symbol: str) -> AsyncIterator[MarketTick]:
        if symbol != self._subscription.symbol:
            raise ProviderConfigurationError(f"This Databento provider instance is bound to {self._subscription.symbol}, not {symbol}.")
        while self._connected:
            yield await self._queue.get()

    async def quotes(self, symbol: str) -> AsyncIterator[MarketTick]:
        async for tick in self.trades(symbol):
            yield tick

    async def historical(self, symbol: str, start: datetime, end: datetime) -> list[MarketTick]:
        if symbol != self._subscription.symbol:
            raise ProviderConfigurationError(f"This Databento provider instance is bound to {self._subscription.symbol}, not {symbol}.")
        if start.tzinfo is None or end.tzinfo is None or end < start:
            raise ValueError("Historical range requires ordered timezone-aware timestamps.")
        return await asyncio.to_thread(self._historical_sync, start, end)

    def source_metadata(self) -> dict[str, str]:
        venue = "CME Globex / COMEX" if self._subscription.symbol in {"GC", "MGC"} else "CME Globex"
        metadata = {
            "mode": "live",
            "provider": "Databento",
            "dataset": self._dataset,
            "venue": venue,
            "symbol": self._subscription.parent_symbol,
            "schema": self._schema,
            "aggressor_side": "inferred only when a current market-by-price BBO is available",
            "depth": "top of book only" if self._schema == "mbp-1" else "top ten market-by-price levels",
        }
        if self._last_event_at:
            metadata["last_event_at"] = self._last_event_at.isoformat()
        if self._last_reconnect_gap:
            metadata["last_reconnect_gap"] = self._last_reconnect_gap
        if self._last_error:
            metadata["last_error"] = self._last_error
        return metadata

    def _historical_sync(self, start: datetime, end: datetime) -> list[MarketTick]:
        """Fetch intraday records through the same normalized parsing boundary."""
        try:
            import databento as db
        except ImportError as exc:  # pragma: no cover - configuration guard
            raise ProviderConfigurationError("Install the databento package before using historical futures data.") from exc
        client = db.Historical(self._api_key)
        store = client.timeseries.get_range(
            dataset=self._dataset,
            schema=self._schema,
            stype_in="parent",
            symbols=self._subscription.parent_symbol,
            start=start,
            end=end,
        )
        ticks: list[MarketTick] = []
        for record in store:
            tick = self._record_to_tick(record)
            if tick is not None:
                ticks.append(tick)
        return ticks

    def _on_record(self, record: Any) -> None:
        if record.__class__.__name__ == "ErrorMsg":
            self._last_error = str(record)
            logger.error("Databento gateway error for %s: %s", self._subscription.symbol, record)
            return
        try:
            tick = self._record_to_tick(record)
        except Exception:
            logger.exception("Could not normalize a Databento record")
            return
        if tick is None or self._loop is None:
            return
        self._last_event_at = tick.timestamp
        self._loop.call_soon_threadsafe(self._enqueue, tick)

    def _on_reconnect(self, previous: Any, current: Any) -> None:
        self._last_reconnect_gap = f"{previous} to {current}"
        logger.warning("Databento reconnected for %s; gap %s", self._subscription.symbol, self._last_reconnect_gap)

    def _on_callback_error(self, error: Exception) -> None:
        self._last_error = str(error)
        logger.error("Databento callback failed for %s: %s", self._subscription.symbol, error)

    def _enqueue(self, tick: MarketTick) -> None:
        if self._queue.full():
            self._queue.get_nowait()
        self._queue.put_nowait(tick)

    def _record_to_tick(self, record: Any) -> MarketTick | None:
        if getattr(record, "is_heartbeat", lambda: False)():
            return None
        quote = self._extract_quote(record)
        depth_levels = self._extract_depth(record)
        if quote is not None:
            self._last_quote = quote
        if self._token(getattr(record, "action", "")) not in {"T", "TRADE"}:
            return None
        price = self._price(getattr(record, "price", None))
        size = int(getattr(record, "size", 0) or 0)
        if price is None or size <= 0:
            return None
        timestamp = self._timestamp(getattr(record, "ts_event", None))
        bid, ask = self._last_quote or (price, price)
        aggressor = Direction.NEUTRAL
        if self._last_quote is not None:
            if price >= ask:
                aggressor = Direction.BULLISH
            elif price <= bid:
                aggressor = Direction.BEARISH
        buy = size if aggressor == Direction.BULLISH else 0
        sell = size if aggressor == Direction.BEARISH else 0
        unknown = size if aggressor == Direction.NEUTRAL else 0
        return MarketTick(
            timestamp=timestamp,
            symbol=self._subscription.symbol,
            raw_symbol=self._subscription.parent_symbol,
            price=price,
            bid=bid,
            ask=ask,
            volume=size,
            aggressive_side=aggressor,
            aggressor_side_source=f"{self._schema.upper()} trade matched to current BBO" if aggressor != Direction.NEUTRAL else "Unclassified: no matching BBO",
            buy_volume=buy,
            sell_volume=sell,
            unknown_volume=unknown,
            source=f"Databento {self._dataset} {self._schema.upper()}",
            depth_levels=depth_levels,
        )

    @classmethod
    def _token(cls, value: Any) -> str:
        return str(getattr(value, "value", value)).upper().rsplit(".", 1)[-1]

    @classmethod
    def _price(cls, value: Any) -> float | None:
        if value is None:
            return None
        numeric = float(value)
        # DBN wire prices are fixed-point nanodollars; some client surfaces
        # already expose decimals. This keeps both representations explicit.
        return numeric / 1_000_000_000 if abs(numeric) >= 10_000_000 else numeric

    @classmethod
    def _timestamp(cls, value: Any) -> datetime:
        if value is None:
            return datetime.now(UTC)
        numeric = int(value)
        return datetime.fromtimestamp(numeric / 1_000_000_000 if numeric >= 10_000_000_000 else numeric, UTC)

    def _extract_quote(self, record: Any) -> tuple[float, float] | None:
        levels = getattr(record, "levels", None)
        if not levels:
            return None
        level = levels[0]
        bid = self._price(getattr(level, "bid_px", None))
        ask = self._price(getattr(level, "ask_px", None))
        if bid is None or ask is None or bid > ask:
            return None
        return bid, ask

    def _extract_depth(self, record: Any) -> list[DepthLevel]:
        levels = getattr(record, "levels", None)
        if not levels:
            return []
        depth: list[DepthLevel] = []
        maximum = 1 if self._schema == "mbp-1" else 10
        for index in range(maximum):
            try:
                level = levels[index]
            except (IndexError, KeyError, TypeError):
                break
            bid = self._price(getattr(level, "bid_px", None))
            ask = self._price(getattr(level, "ask_px", None))
            bid_size = int(getattr(level, "bid_sz", 0) or 0)
            ask_size = int(getattr(level, "ask_sz", 0) or 0)
            if bid is None and ask is None:
                continue
            depth.append(DepthLevel(level=index, bid_price=bid, bid_size=bid_size, ask_price=ask, ask_size=ask_size))
        return depth


class TradingEconomicsCalendarProvider(EconomicCalendarProvider):
    """Licensed economic calendar source for upcoming events and releases."""

    BASE_URL = "https://api.tradingeconomics.com"

    def __init__(self, api_key: str, base_url: str = BASE_URL) -> None:
        if not api_key.strip():
            raise ProviderConfigurationError("TRADING_ECONOMICS_API_KEY is required for the licensed calendar provider.")
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(15.0))

    async def close(self) -> None:
        await self._client.aclose()

    def source_metadata(self) -> dict[str, str]:
        return {"provider": "Trading Economics", "mode": "licensed", "coverage": "calendar actuals, consensus, revisions, importance"}

    async def upcoming(self, start: datetime, end: datetime, countries: tuple[str, ...]) -> list[EconomicCalendarEvent]:
        if start.tzinfo is None or end.tzinfo is None or end < start:
            raise ValueError("Calendar range requires ordered timezone-aware timestamps.")
        country_path = ",".join(countries)
        response = await self._client.get(
            f"{self._base_url}/calendar/country/{country_path}/{start:%Y-%m-%d}/{end:%Y-%m-%d}",
            params={"c": self._api_key, "f": "json", "values": "true"},
        )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, list):
            raise ProviderConfigurationError("Trading Economics returned an unexpected calendar payload.")
        return [self._event(item) for item in payload if isinstance(item, dict)]

    @staticmethod
    def _event(item: dict[str, Any]) -> EconomicCalendarEvent:
        raw_date = str(item.get("Date") or item.get("date") or "")
        scheduled_at = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
        if scheduled_at.tzinfo is None:
            scheduled_at = scheduled_at.replace(tzinfo=UTC)
        importance = max(1, min(3, int(item.get("Importance") or item.get("importance") or 1)))
        impact = {1: "LOW", 2: "MEDIUM", 3: "HIGH"}[importance]
        return EconomicCalendarEvent(
            id=str(item.get("CalendarId") or item.get("calendarId") or f"calendar-{scheduled_at.timestamp()}-{item.get('Event', item.get('event', 'event'))}"),
            title=str(item.get("Event") or item.get("event") or "Economic release"),
            scheduled_at=scheduled_at,
            country=item.get("Country") or item.get("country"),
            currency=item.get("Currency") or item.get("currency"),
            importance=importance,
            expected_volatility_impact=impact,
            impact_basis=f"Trading Economics importance {importance}/3 maps to {impact.lower()} expected volatility risk. Direction is not inferred.",
            actual=item.get("Actual") or item.get("actual"),
            forecast=item.get("Forecast") or item.get("forecast"),
            previous=item.get("Previous") or item.get("previous"),
            revised=item.get("Revised") or item.get("revised"),
            source=str(item.get("Source") or item.get("source") or "Trading Economics"),
            source_url=item.get("SourceURL") or item.get("sourceUrl") or item.get("URL") or item.get("url"),
        )


class UnavailableEconomicCalendarProvider(EconomicCalendarProvider):
    async def upcoming(self, start: datetime, end: datetime, countries: tuple[str, ...]) -> list[EconomicCalendarEvent]:
        return []

    async def close(self) -> None:
        return None

    def source_metadata(self) -> dict[str, str]:
        return {"provider": "not configured", "mode": "unavailable", "coverage": "none"}
