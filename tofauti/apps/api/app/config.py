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
    supabase_url: str | None
    supabase_service_role_key: str | None

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)


def load_settings() -> Settings:
    settings = Settings(
        demo_mode=required_boolean("DEMO_MODE", True),
        redis_enabled=required_boolean("REDIS_ENABLED", False),
        database_url=os.getenv("DATABASE_URL"),
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    )
    if bool(settings.supabase_url) != bool(settings.supabase_service_role_key):
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured together.")
    if not settings.demo_mode:
        raise RuntimeError("V0.1 supports DEMO_MODE=true only. Connect a verified provider before disabling it.")
    return settings
