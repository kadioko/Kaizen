from __future__ import annotations

import os
from dataclasses import dataclass


def required_boolean(name: str, default: bool) -> bool:
    raw = os.getenv(name, str(default)).strip().lower()
    if raw in {"true", "1", "yes"}:
        return True
    if raw in {"false", "0", "no"}:
        return False
    raise RuntimeError(f"{name} must be true or false.")


def configured_choice(name: str, default: str, allowed: set[str]) -> str:
    value = os.getenv(name, default).strip().lower()
    if value not in allowed:
        values = ", ".join(sorted(allowed))
        raise RuntimeError(f"{name} must be one of: {values}.")
    return value


def configured_symbols(name: str, default: str) -> tuple[str, ...]:
    symbols = tuple(symbol.strip().upper() for symbol in os.getenv(name, default).split(",") if symbol.strip())
    if not symbols:
        raise RuntimeError(f"{name} must include at least one instrument symbol.")
    if len(symbols) != len(set(symbols)):
        raise RuntimeError(f"{name} must not contain duplicate instrument symbols.")
    return symbols


def configured_symbol_map(name: str, default: str) -> dict[str, str]:
    pairs: dict[str, str] = {}
    for entry in os.getenv(name, default).split(","):
        key, separator, value = entry.partition("=")
        if not separator or not key.strip() or not value.strip():
            raise RuntimeError(f"{name} entries must use SYMBOL=provider_parent_symbol.")
        symbol = key.strip().upper()
        if symbol in pairs:
            raise RuntimeError(f"{name} must not map {symbol} more than once.")
        pairs[symbol] = value.strip()
    return pairs


@dataclass(frozen=True)
class Settings:
    demo_mode: bool
    market_data_provider: str
    databento_api_key: str | None
    databento_dataset: str
    databento_schema: str
    enabled_futures: tuple[str, ...]
    databento_parent_symbols: dict[str, str]
    calendar_provider: str
    trading_economics_api_key: str | None
    calendar_countries: tuple[str, ...]
    redis_enabled: bool
    database_url: str | None
    supabase_url: str | None
    supabase_service_role_key: str | None
    cors_origins: tuple[str, ...]
    allow_demo_controls: bool

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)


def load_settings() -> Settings:
    settings = Settings(
        demo_mode=required_boolean("DEMO_MODE", True),
        market_data_provider=configured_choice("MARKET_DATA_PROVIDER", "mock", {"mock", "databento"}),
        databento_api_key=os.getenv("DATABENTO_API_KEY"),
        databento_dataset=os.getenv("DATABENTO_DATASET", "GLBX.MDP3").strip(),
        databento_schema=configured_choice("DATABENTO_SCHEMA", "mbp-1", {"mbp-1", "mbp-10"}),
        enabled_futures=configured_symbols("TOFAUTI_FUTURES", "GC,MGC"),
        databento_parent_symbols=configured_symbol_map("DATABENTO_PARENT_SYMBOLS", "GC=GC.FUT,MGC=MGC.FUT"),
        calendar_provider=configured_choice("ECONOMIC_CALENDAR_PROVIDER", "none", {"none", "trading_economics"}),
        trading_economics_api_key=os.getenv("TRADING_ECONOMICS_API_KEY"),
        calendar_countries=tuple(country.strip() for country in os.getenv("CALENDAR_COUNTRIES", "united states").split(",") if country.strip()),
        redis_enabled=required_boolean("REDIS_ENABLED", False),
        database_url=os.getenv("DATABASE_URL"),
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        cors_origins=tuple(origin.strip().rstrip("/") for origin in os.getenv("CORS_ORIGINS", "http://localhost:3001,http://127.0.0.1:3001,https://tofauti.vercel.app").split(",") if origin.strip()),
        allow_demo_controls=required_boolean("ALLOW_DEMO_CONTROLS", False),
    )
    if bool(settings.supabase_url) != bool(settings.supabase_service_role_key):
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured together.")
    if settings.market_data_provider == "databento":
        if settings.demo_mode:
            raise RuntimeError("DEMO_MODE must be false when MARKET_DATA_PROVIDER=databento.")
        if not settings.databento_api_key:
            raise RuntimeError("DATABENTO_API_KEY is required when MARKET_DATA_PROVIDER=databento.")
        missing_parent_symbols = set(settings.enabled_futures) - set(settings.databento_parent_symbols)
        if missing_parent_symbols:
            missing = ", ".join(sorted(missing_parent_symbols))
            raise RuntimeError(f"DATABENTO_PARENT_SYMBOLS is missing configured futures: {missing}.")
    elif not settings.demo_mode:
        raise RuntimeError("A live runtime requires MARKET_DATA_PROVIDER=databento and an entitled API key.")
    if settings.allow_demo_controls and not settings.demo_mode:
        raise RuntimeError("ALLOW_DEMO_CONTROLS is only valid in DEMO_MODE=true.")
    if settings.calendar_provider == "trading_economics" and not settings.trading_economics_api_key:
        raise RuntimeError("TRADING_ECONOMICS_API_KEY is required when ECONOMIC_CALENDAR_PROVIDER=trading_economics.")
    return settings
