import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps" / "api"))
from app.main import app  # noqa: E402


def test_api_starts_and_streams_independent_simulated_gc_and_mgc():
    with TestClient(app) as client:
        health = client.get("/health").json()
        assert health["market_data_provider"] == "mock"
        assert set(health["runtimes"]) == {"GC", "MGC"}
        assert health["capabilities"]["market_data"]["availability"] == "UNAVAILABLE"
        assert client.get("/api/capabilities").json()["market_depth"]["availability"] == "UNAVAILABLE"
        instrument_response = client.get("/api/instruments").json()
        assert {item["symbol"] for item in instrument_response["active"]} == {"GC", "MGC"}
        assert {item["symbol"] for item in instrument_response["catalog"]} == {"GC", "MGC", "NQ", "MNQ"}
        for symbol in ["GC", "MGC"]:
            response = client.get(f"/api/snapshot/{symbol}")
            assert response.status_code == 200
            assert response.json()["instrument"]["symbol"] == symbol
            assert response.json()["source"]["mode"] == "simulated"
            with client.websocket_connect(f"/ws/market/{symbol}") as socket:
                assert socket.receive_json()["instrument"]["symbol"] == symbol
        assert client.get("/api/snapshot/EURUSD").status_code == 404
        assert client.get("/api/setups/MGC").json() == []
        assert client.get("/api/analytics/GC").json()["availability"] == "UNAVAILABLE"
        assert client.post("/api/demo/scenario", json={"scenario": "mixed"}).status_code == 403
        assert client.post("/api/analyst/query", json={"question": "x" * 2001}).status_code == 422
        calendar = client.get("/api/calendar").json()
        assert calendar["availability"] == "UNAVAILABLE"
        assert calendar["events"] == []
        cors = client.options("/api/snapshot/GC", headers={"Origin": "https://tofauti.vercel.app", "Access-Control-Request-Method": "GET"})
        assert cors.headers["access-control-allow-origin"] == "https://tofauti.vercel.app"
