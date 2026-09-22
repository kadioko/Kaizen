from __future__ import annotations

import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ENGINE_PATH = Path(__file__).resolve().parents[3] / "packages" / "market-engine"
if str(ENGINE_PATH) not in sys.path:
    sys.path.insert(0, str(ENGINE_PATH))

from tofauti_market_engine.models import DemoScenario, Instrument, MarketSnapshot  # noqa: E402
from tofauti_market_engine.providers import (  # noqa: E402
    DatabentoMarketDataProvider,
    MockMacroDataProvider,
    MockMarketDataProvider,
    TradingEconomicsCalendarProvider,
    UnavailableEconomicCalendarProvider,
    UnavailableMacroDataProvider,
)
from tofauti_market_engine.runtime import WarRoomRuntime  # noqa: E402
from .analyst import MockAIAnalyst  # noqa: E402
from .config import load_settings  # noqa: E402
from .repository import SupabaseRepository  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("tofauti.api")
settings = load_settings()
repository = SupabaseRepository(settings.supabase_url, settings.supabase_service_role_key) if settings.supabase_configured else None
analyst = MockAIAnalyst()

INSTRUMENTS = {
    "GC": Instrument(symbol="GC", name="Gold Futures", tick_size=0.1, point_value=100, exchange="COMEX"),
    "MGC": Instrument(symbol="MGC", name="Micro Gold Futures", tick_size=0.1, point_value=10, exchange="COMEX"),
}


def build_runtime(symbol: str) -> WarRoomRuntime:
    instrument = INSTRUMENTS[symbol]
    if settings.market_data_provider == "databento":
        return WarRoomRuntime(
            instrument=instrument,
            provider=DatabentoMarketDataProvider(settings.databento_api_key or "", symbol, settings.databento_dataset),
            macro_provider=UnavailableMacroDataProvider(),
            repository=repository,
        )
    return WarRoomRuntime(
        instrument=instrument,
        provider=MockMarketDataProvider(),
        macro_provider=MockMacroDataProvider(),
        repository=repository,
    )


runtimes = {symbol: build_runtime(symbol) for symbol in INSTRUMENTS}
calendar_provider = (
    TradingEconomicsCalendarProvider(settings.trading_economics_api_key or "")
    if settings.calendar_provider == "trading_economics"
    else UnavailableEconomicCalendarProvider()
)


def runtime_for(symbol: str) -> WarRoomRuntime:
    try:
        return runtimes[symbol]
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="V0.1 supports GC and MGC only.") from exc


@asynccontextmanager
async def lifespan(_: FastAPI):
    await asyncio.gather(*(runtime.start() for runtime in runtimes.values()))
    logger.info("TOFAUTI %s runtime started", settings.market_data_provider)
    yield
    await asyncio.gather(*(runtime.stop() for runtime in runtimes.values()))
    await calendar_provider.close()
    if repository:
        await repository.close()
    logger.info("TOFAUTI runtime stopped")


app = FastAPI(title="TOFAUTI Market Intelligence API", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScenarioRequest(BaseModel):
    scenario: DemoScenario


class AnalystRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    symbol: str = Field(default="GC", pattern="^(GC|MGC)$")


@app.get("/health")
async def health() -> dict[str, object]:
    runtime_states = {
        symbol: {
            "provider": runtime.provider.source_metadata(),
            "stream": "stopped" if runtime._task and runtime._task.done() else "running",
            "persistence_status": runtime.persistence_status,
            "latest_snapshot_at": runtime.snapshot.timestamp.isoformat() if runtime.snapshot else None,
        }
        for symbol, runtime in runtimes.items()
    }
    degraded = any(state["stream"] == "stopped" or state["persistence_status"] == "degraded" for state in runtime_states.values())
    return {
        "status": "degraded" if degraded else "ok",
        "mode": "demo" if settings.demo_mode else "live",
        "market_data_provider": settings.market_data_provider,
        "calendar": calendar_provider.source_metadata(),
        "persistence": "supabase" if settings.supabase_configured else "in_memory",
        "runtimes": runtime_states,
    }


@app.get("/api/instruments")
async def instruments():
    return list(INSTRUMENTS.values())


@app.get("/api/snapshot/{symbol}")
async def get_snapshot(symbol: str) -> MarketSnapshot:
    runtime = runtime_for(symbol)
    if runtime.snapshot is None and settings.demo_mode:
        await runtime.step()
    if runtime.snapshot is None:
        raise HTTPException(status_code=503, detail=f"No {symbol} provider data has arrived yet.")
    return runtime.snapshot


@app.get("/api/events/{symbol}")
async def get_events(symbol: str):
    return (await get_snapshot(symbol)).events


@app.get("/api/setups/{symbol}")
async def get_setups(symbol: str):
    runtime = runtime_for(symbol)
    await get_snapshot(symbol)
    return [{"setup": setup, "outcomes": runtime.setup_outcomes_by_id.get(setup.id, [])} for setup in runtime.setup_records]


@app.get("/api/calendar")
async def get_calendar(days: int = Query(default=7, ge=1, le=31)):
    start = datetime.now(UTC)
    try:
        events = await calendar_provider.upcoming(start, start + timedelta(days=days), settings.calendar_countries)
    except Exception as exc:
        logger.exception("Calendar provider request failed")
        raise HTTPException(status_code=503, detail="Licensed calendar provider is temporarily unavailable.") from exc
    if repository and events:
        try:
            await repository.persist_calendar_events(events)
        except Exception:
            # A provider response remains usable when optional archival storage
            # is temporarily unavailable; health exposes storage degradation.
            logger.exception("Could not persist economic calendar events")
    return {
        "availability": "AVAILABLE" if settings.calendar_provider == "trading_economics" else "UNAVAILABLE",
        "source": calendar_provider.source_metadata(),
        "countries": settings.calendar_countries,
        "events": events,
        "boundary": "Calendar events provide timing, actuals, forecasts, revisions, and importance. They do not create directional macro scores by themselves.",
    }


@app.post("/api/demo/scenario")
async def change_scenario(request: ScenarioRequest):
    if not settings.allow_demo_controls:
        raise HTTPException(status_code=403, detail="Shared demo controls are disabled on this server.")
    await asyncio.gather(*(runtime.set_scenario(request.scenario) for runtime in runtimes.values()))
    return {"scenario": request.scenario, "message": "Demo scenario reset for GC and MGC."}


@app.post("/api/analyst/query")
async def analyst_query(request: AnalystRequest):
    return await analyst.answer(request.question, await get_snapshot(request.symbol))


@app.websocket("/ws/market/{symbol}")
async def market_socket(websocket: WebSocket, symbol: str):
    origin = websocket.headers.get("origin")
    if origin and origin.rstrip("/") not in settings.cors_origins:
        await websocket.close(code=1008, reason="Origin is not allowed.")
        return
    try:
        runtime = runtime_for(symbol)
    except HTTPException:
        await websocket.close(code=1008, reason="V0.1 supports GC and MGC only.")
        return
    await websocket.accept()
    queue: asyncio.Queue[MarketSnapshot] = asyncio.Queue(maxsize=2)

    async def push(snapshot: MarketSnapshot) -> None:
        if queue.full():
            queue.get_nowait()
        queue.put_nowait(snapshot.model_copy(deep=True))

    runtime.add_subscriber(push)
    try:
        if runtime.snapshot:
            await push(runtime.snapshot)
        while True:
            snapshot = await queue.get()
            await websocket.send_json(snapshot.model_dump(mode="json"))
    except WebSocketDisconnect:
        pass
    finally:
        runtime.remove_subscriber(push)
