#!/usr/bin/env python3
"""Fail a release when the hosted TOFAUTI engine is not demonstrably live."""

from __future__ import annotations

import argparse
import sys
from datetime import UTC, datetime
from typing import Any

import httpx


def fail(message: str) -> None:
    raise RuntimeError(message)


def as_mapping(value: object, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(f"{label} returned an unexpected payload.")
    return value


def get_payload(client: httpx.Client, url: str, label: str) -> dict[str, Any]:
    response = client.get(url)
    response.raise_for_status()
    try:
        return as_mapping(response.json(), label)
    except ValueError as exc:
        raise RuntimeError(f"{label} did not return JSON.") from exc


def as_iso_timestamp(value: object, label: str) -> datetime:
    if not isinstance(value, str):
        fail(f"{label} is missing its timestamp.")
    try:
        timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise RuntimeError(f"{label} returned an invalid timestamp.") from exc
    if timestamp.tzinfo is None:
        fail(f"{label} returned a timezone-naive timestamp.")
    return timestamp


def verify(api_url: str, symbols: list[str], max_age_seconds: int, expected_schema: str) -> None:
    base_url = api_url.rstrip("/")
    with httpx.Client(timeout=15.0, follow_redirects=False) as client:
        health = get_payload(client, f"{base_url}/health", "/health")
        if health.get("status") != "ok" or health.get("mode") != "live":
            fail("Hosted engine is not healthy live mode.")
        if health.get("market_data_provider") != "databento":
            fail("Hosted engine is not using the Databento provider.")
        if health.get("persistence") != "supabase":
            fail("Hosted engine has not confirmed Supabase persistence.")

        capabilities = get_payload(client, f"{base_url}/api/capabilities", "/api/capabilities")
        market_data = as_mapping(capabilities.get("market_data"), "market_data capability")
        if market_data.get("availability") != "AVAILABLE" or market_data.get("schema") != expected_schema:
            fail("Exchange-trade capability is unavailable or uses an unexpected schema.")
        depth = as_mapping(capabilities.get("market_depth"), "market_depth capability")
        expected_depth = "AVAILABLE" if expected_schema == "mbp-10" else "UNAVAILABLE"
        if depth.get("availability") != expected_depth:
            fail("Depth capability does not match the selected Databento schema.")
        if as_mapping(capabilities.get("analyst"), "analyst capability").get("availability") != "UNAVAILABLE":
            fail("A production engine must not expose the demo analyst.")

        runtimes = as_mapping(health.get("runtimes"), "runtime health")
        now = datetime.now(UTC)
        for symbol in symbols:
            runtime = as_mapping(runtimes.get(symbol), f"{symbol} runtime")
            if runtime.get("stream") != "running" or runtime.get("persistence_status") != "healthy":
                fail(f"{symbol} runtime is not streaming with healthy persistence.")
            timestamp = as_iso_timestamp(runtime.get("latest_snapshot_at"), f"{symbol} runtime")
            age = (now - timestamp.astimezone(UTC)).total_seconds()
            if age < -5 or age > max_age_seconds:
                fail(f"{symbol} snapshot is stale or has an invalid clock ({age:.1f}s).")

            snapshot = get_payload(client, f"{base_url}/api/snapshot/{symbol}", f"{symbol} snapshot")
            source = as_mapping(snapshot.get("source"), f"{symbol} source")
            if source.get("mode") != "live" or source.get("provider") != "Databento":
                fail(f"{symbol} snapshot is not source-labelled as live Databento data.")
            if snapshot.get("instrument", {}).get("symbol") != symbol:
                fail(f"{symbol} snapshot contains a mismatched instrument.")

        calendar = get_payload(client, f"{base_url}/api/calendar", "/api/calendar")
        if calendar.get("availability") != "AVAILABLE":
            fail("Licensed calendar data is not available.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-url", required=True, help="HTTPS URL of the hosted FastAPI service.")
    parser.add_argument("--symbols", default="GC,MGC", help="Comma-separated enabled futures symbols.")
    parser.add_argument("--max-age-seconds", type=int, default=120, help="Maximum accepted snapshot age.")
    parser.add_argument("--databento-schema", choices=("mbp-1", "mbp-10"), default="mbp-1")
    args = parser.parse_args()
    if args.max_age_seconds <= 0:
        parser.error("--max-age-seconds must be positive.")
    symbols = [symbol.strip().upper() for symbol in args.symbols.split(",") if symbol.strip()]
    if not symbols:
        parser.error("--symbols must include at least one instrument.")
    try:
        verify(args.api_url, symbols, args.max_age_seconds, args.databento_schema)
    except (httpx.HTTPError, RuntimeError) as exc:
        print(f"LIVE ENGINE CHECK FAILED: {exc}", file=sys.stderr)
        return 1
    print(f"LIVE ENGINE CHECK PASSED: {', '.join(symbols)} via {args.api_url.rstrip('/')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
