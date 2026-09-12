from __future__ import annotations

from abc import ABC, abstractmethod

from tofauti_market_engine.models import MarketSnapshot


class LLMAnalyst(ABC):
    """Explanation boundary. Implementations receive facts, never a data-provider handle."""

    @abstractmethod
    async def answer(self, question: str, snapshot: MarketSnapshot) -> dict[str, object]: ...


class MockAIAnalyst(LLMAnalyst):
    async def answer(self, question: str, snapshot: MarketSnapshot) -> dict[str, object]:
        query = question.lower()
        evidence = {
            "macro": snapshot.macro.model_dump(mode="json"),
            "structure": snapshot.structure.model_dump(mode="json"),
            "order_flow": snapshot.order_flow.model_dump(mode="json"),
            "liquidity": snapshot.liquidity.model_dump(mode="json"),
            "alignment": snapshot.alignment.model_dump(mode="json"),
            "levels": [level.model_dump(mode="json") for level in snapshot.levels],
        }
        if "invalidate" in query:
            text = f"The active simulated setup is invalidated at {snapshot.setup.invalidation:.1f}." if snapshot.setup else "No confirmed setup exists, so there is no setup invalidation level."
        elif "changed" in query:
            text = f"The latest calculated state is {snapshot.war_room_state.value}; the latest timeline event is {snapshot.events[0].title if snapshot.events else 'not available'}."
        elif "level" in query:
            nearest = min(snapshot.levels, key=lambda level: abs(level.price - snapshot.price))
            text = f"The nearest stored level is {nearest.type} at {nearest.price:.1f}, {abs(nearest.price - snapshot.price):.1f} points from the simulated price."
        elif "bearish" in query or "bullish" in query or "why" in query:
            text = f"Gold is calculated as {snapshot.alignment.direction.value} because macro is {snapshot.macro.direction.value}, structure is {snapshot.structure.direction.value}, order flow is {snapshot.order_flow.direction.value}, and liquidity is {snapshot.liquidity.direction.value}."
        else:
            text = "I can explain only the supplied TOFAUTI snapshot. Ask about alignment, what changed, invalidation, or a key level."
        return {"answer": text, "source": "MockAIAnalyst", "evidence": evidence, "disclaimer": "Explanation of simulated calculated data only; not financial advice."}
