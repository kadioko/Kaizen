from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from random import Random

from .models import DemoScenario, Direction, MacroFactor, MarketTick


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


class MacroDataProvider(ABC):
    @abstractmethod
    async def current_factors(self, scenario: DemoScenario) -> list[MacroFactor]: ...


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

    def __init__(self, scenario: DemoScenario = DemoScenario.BEARISH_LIQUIDITY_SWEEP, seed: int = 42) -> None:
        self.scenario = scenario
        self._index = 0
        self._rng = Random(seed)
        self._connected = False
        self._start = datetime.now(UTC).replace(second=0, microsecond=0)
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
        self._start = datetime.now(UTC).replace(second=0, microsecond=0)
        self.cycle_started = False

    def next_tick(self, symbol: str = "GC") -> MarketTick:
        if self._index >= 75:
            self._index = 0
            self._start = datetime.now(UTC).replace(second=0, microsecond=0)
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
            yield self.next_tick(symbol)

    async def quotes(self, symbol: str) -> AsyncIterator[MarketTick]:
        async for tick in self.trades(symbol):
            yield tick

    async def historical(self, symbol: str, start: datetime, end: datetime) -> list[MarketTick]:
        clone = MockMarketDataProvider(self.scenario, seed=42)
        result: list[MarketTick] = []
        while True:
            tick = clone.next_tick(symbol)
            if tick.timestamp > end:
                break
            if tick.timestamp >= start:
                result.append(tick)
            if len(result) >= 250:
                break
        return result


class MockMacroDataProvider(MacroDataProvider):
    async def current_factors(self, scenario: DemoScenario) -> list[MacroFactor]:
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
