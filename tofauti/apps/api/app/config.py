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


@dataclass(frozen=True)
class Settings:
    demo_mode: bool
    redis_enabled: bool
    database_url: str | None


def load_settings() -> Settings:
    settings = Settings(
        demo_mode=required_boolean("DEMO_MODE", True),
        redis_enabled=required_boolean("REDIS_ENABLED", False),
        database_url=os.getenv("DATABASE_URL"),
    )
    if not settings.demo_mode:
        raise RuntimeError("V0.1 supports DEMO_MODE=true only. Connect a verified provider before disabling it.")
    return settings
