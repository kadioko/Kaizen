# Deployment

## September 20 Readiness Changes

Set `CORS_ORIGINS` on FastAPI to the exact frontend origins (comma-separated). Browser WebSockets check the same allowlist. Keep `ALLOW_DEMO_CONTROLS=false` on a shared host; enabling it permits global scenario resets without authentication and is intended only for private local development.

`/health` now includes `persistence_status`: `in_memory`, `pending`, `healthy` or `degraded`. Configured Supabase credentials alone do not prove writes are succeeding. Verify stored rows and restart recovery before calling cloud persistence operational.

The selected spot-reference route serves `XAU/USD`, `EUR/USD`, `GBP/USD`, and `USD/JPY` one-minute bars with per-market five-minute server caching and CDN caching. Provider HTTP 429 responses back off for 30 minutes and are shown explicitly. Multiple regions or other apps can still share/exhaust the upstream allowance; a central budget is not implemented. Never expose `TWELVE_DATA_API_KEY` to browser code. The official FOMC schedule route needs no secret and labels published FOMC dates as `HIGH` scheduled volatility risk; it does not provide a global calendar or directional forecast.

Add the deployed `/settings` URL to Supabase Auth's redirect allowlist for email confirmations. Verify watchlist instruments are seeded and use separate test accounts to check RLS. These live account checks are still pending.

## Architecture

Supabase hosts PostgreSQL, Auth, and row-level security. It does not host the long-running FastAPI worker/WebSocket service. Deploy the API as the Docker service in `render.yaml` (or an equivalent persistent container host), then deploy `apps/web` to Vercel.

## 1. Supabase Schema

The TOFAUTI schema is deployed to the Kaizen Supabase project as the tracked migration `create_tofauti_market_intelligence`. It owns 13 `tofauti_`-prefixed tables and six RLS policies, without modifying K OG tables.

For a new environment, link the intended project and apply `supabase/migrations/20260912193000_create_tofauti_market_intelligence.sql`:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration uses `tofauti_`-prefixed tables so TOFAUTI can safely share the Kaizen Supabase project. It enables RLS everywhere and only permits authenticated users to access their own profile and watchlist. Market ingestion remains server-only through the service role.

## 2. Deploy FastAPI

Create a Docker web service from this repository with `tofauti` as the service root. The supplied `render.yaml` is deliberately configured for live mode and will not start until all secret values are present. Configure these server-only environment variables:

```text
DEMO_MODE=false
MARKET_DATA_PROVIDER=databento
DATABENTO_DATASET=GLBX.MDP3
DATABENTO_API_KEY=YOUR_ENTITLED_SERVER_ONLY_DATABENTO_KEY
ECONOMIC_CALENDAR_PROVIDER=trading_economics
TRADING_ECONOMICS_API_KEY=YOUR_SERVER_ONLY_TRADING_ECONOMICS_KEY
CALENDAR_COUNTRIES=united states
ALLOW_DEMO_CONTROLS=false
REDIS_ENABLED=false
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_KEY
```

Apply `20260922103000_add_live_provider_provenance.sql` after the base TOFAUTI migration. It adds raw-provider provenance, unknown-volume accounting, macro availability, nullable live scenario values, and licensed calendar archival.

Do not set `NEXT_PUBLIC_API_URL` until `GET /health` returns `mode: live`, `market_data_provider: databento`, two running runtimes, and source metadata that names `Databento` / `GLBX.MDP3`. The detailed validation sequence is in [Live Futures Runbook](LIVE_FUTURES_RUNBOOK.md).

For local deterministic tests only:

```text
DEMO_MODE=true
MARKET_DATA_PROVIDER=mock
ECONOMIC_CALENDAR_PROVIDER=none
REDIS_ENABLED=false
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_KEY
```

Confirm `GET /health` returns `"persistence": "supabase"` before enabling any future API-backed futures features. Do not use a Vercel Function for a persistent futures worker or WebSocket service.

## 3. Connect Vercel

In the TOFAUTI Vercel project, set:

```text
NEXT_PUBLIC_API_URL=https://YOUR_FASTAPI_HOST
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
TWELVE_DATA_API_KEY=YOUR_SERVER_ONLY_TWELVE_DATA_KEY
```

`TWELVE_DATA_API_KEY` is optional and must be stored as a sensitive server-only Vercel value. It enables only the separate selected-spot reference endpoint; it does not enable GC/MGC futures, CME data, order flow, or setup generation.

Redeploy after adding variables. The service-role key belongs only on the API host. The current public web app does not require `NEXT_PUBLIC_API_URL`: it uses its own server-side spot and official-schedule routes. Do not connect the FastAPI mock runtime to public pages.
