from __future__ import annotations

import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ENGINE_PATH = Path(__file__).resolve().parents[3] / "packages" / "market-engine"
if str(ENGINE_PATH) not in sys.path:
    sys.path.insert(0, str(ENGINE_PATH))

from tofauti_market_engine import DemoScenario, WarRoomRuntime  # noqa: E402
from tofauti_market_engine.models import MarketSnapshot  # noqa: E402
from .analyst import MockAIAnalyst  # noqa: E402
from .config import load_settings  # noqa: E402
from .repository import SupabaseRepository  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("tofauti.api")
settings = load_settings()
repository = SupabaseRepository(settings.supabase_url, settings.supabase_service_role_key) if settings.supabase_configured else None
runtime = WarRoomRuntime(repository=repository)
analyst = MockAIAnalyst()


def snapshot_for_symbol(symbol: str) -> MarketSnapshot:
    if runtime.snapshot is None:
        raise RuntimeError("Market runtime has not produced a snapshot.")
    snapshot = runtime.snapshot.model_copy(deep=True)
    if symbol == "MGC":
        snapshot.instrument = runtime.micro_instrument
        snapshot.source["provider"] = "MockMarketDataProvider (shared GC scenario; not independent MGC activity)"
        for event in snapshot.events:
            event.instrument = "MGC"
            event.id = event.id.replace("GC-", "MGC-", 1)
            event.description = event.description.replace("GC ", "MGC ")
        if snapshot.setup:
            snapshot.setup.instrument = "MGC"
            snapshot.setup.id = snapshot.setup.id.replace("GC-", "MGC-", 1)
    return snapshot


@asynccontextmanager
async def lifespan(_: FastAPI):
    await runtime.start()
    logger.info("TOFAUTI demo runtime started")
    yield
    await runtime.stop()
    if repository:
        await repository.close()
    logger.info("TOFAUTI demo runtime stopped")


app = FastAPI(title="TOFAUTI Market Intelligence API", version="0.1.0", lifespan=lifespan)
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
async def health() -> dict[str, str]:
    return {
        "status": "degraded" if runtime.persistence_status == "degraded" or runtime.snapshot is None or (runtime._task and runtime._task.done()) else "ok",
        "mode": "demo" if settings.demo_mode else "provider",
        "provider": "MockMarketDataProvider",
        "persistence": "supabase" if settings.supabase_configured else "in_memory",
        "persistence_status": runtime.persistence_status,
    }


@app.get("/api/instruments")
async def instruments():
    return [runtime.instrument, runtime.micro_instrument]


@app.get("/api/snapshot/{symbol}")
async def get_snapshot(symbol: str) -> MarketSnapshot:
    if symbol not in {"GC", "MGC"}:
        raise HTTPException(status_code=404, detail="V0.1 supports GC and MGC only.")
    if runtime.snapshot is None:
        await runtime.step()
    return snapshot_for_symbol(symbol)


@app.get("/api/events/{symbol}")
async def get_events(symbol: str):
    snapshot = await get_snapshot(symbol)
    return snapshot.events


@app.get("/api/setups/{symbol}")
async def get_setups(symbol: str):
    await get_snapshot(symbol)
    return [{"setup": setup, "outcomes": runtime.setup_outcomes_by_id.get(setup.id, [])} for setup in runtime.setup_records if setup.instrument == symbol]


@app.post("/api/demo/scenario")
async def change_scenario(request: ScenarioRequest):
    if not settings.allow_demo_controls:
        raise HTTPException(status_code=403, detail="Shared demo controls are disabled on this server.")
    await runtime.set_scenario(request.scenario)
    return {"scenario": request.scenario, "message": "Demo scenario reset."}


@app.post("/api/analyst/query")
async def analyst_query(request: AnalystRequest):
    snapshot = await get_snapshot(request.symbol)
    return await analyst.answer(request.question, snapshot)


@app.websocket("/ws/market/{symbol}")
async def market_socket(websocket: WebSocket, symbol: str):
    origin = websocket.headers.get("origin")
    if origin and origin.rstrip("/") not in settings.cors_origins:
        await websocket.close(code=1008, reason="Origin is not allowed.")
        return
    if symbol not in {"GC", "MGC"}:
        await websocket.close(code=1008, reason="V0.1 supports GC and MGC only.")
        return
    await websocket.accept()
    queue: asyncio.Queue[MarketSnapshot] = asyncio.Queue(maxsize=2)

    async def push(snapshot: MarketSnapshot) -> None:
        if queue.full():
            queue.get_nowait()
        if symbol == "GC":
            queue.put_nowait(snapshot.model_copy(deep=True))
        else:
            queue.put_nowait(snapshot_for_symbol(symbol))

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
