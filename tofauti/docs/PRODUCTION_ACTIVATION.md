# Production Activation

This is the required sequence for enabling real GC/MGC exchange intelligence. It is intentionally fail-closed: do not add `NEXT_PUBLIC_API_URL` to Vercel until every validation gate passes.

## 1. Shared Kaizen Supabase

The Kaizen Supabase project ref is `eohxxjfuvpuublfglcqc`. TOFAUTI uses this existing shared project; it does not need a separate Supabase instance.

On 2026-09-22, the Kaizen project was verified `ACTIVE_HEALTHY` and the following TOFAUTI migrations were applied through Supabase's tracked Management API migration endpoint:

- `create_tofauti_market_intelligence` (already present)
- `add_live_provider_provenance`
- `add_exchange_aggregate_storage`

The deployed tables remain RLS-enabled without browser policies because they are server-ingestion data. The FastAPI service uses a server-only Supabase service-role key; public browser access must not be added casually.

For a future migration, use the same tracked Management API migration workflow or reconcile migration history under change control before using a broad `supabase db push`. Do not apply the existing files a second time. If the Kaizen project is paused later, resume it in Supabase Studio before any database operation.

## 2. Obtain Licensed Provider Access

Configure only server-side credentials:

- An entitled Databento server API key for `GLBX.MDP3` and the desired CME/COMEX products. Confirm market-data display and redistribution terms for TOFAUTI’s audience.
- A Trading Economics key with economic-calendar access for the selected coverage.
- The Supabase project URL and service-role key for ingestion. The service-role key must never be added to Vercel browser variables.

Use `DATABENTO_SCHEMA=mbp-1` first. It supports trades plus top-of-book. Switch to `mbp-10` only after the entitlement is confirmed and the top-ten market-by-price display has passed acceptance testing. Neither schema is a market-by-order heatmap.

## 3. Deploy The Persistent API

Supabase hosts the shared Kaizen database, authentication, secrets, cron jobs, and Realtime fan-out. Configure these values as Supabase secrets for scheduled ingestion, or as encrypted environment values on a future persistent worker when continuous exchange streaming is required:

```text
DEMO_MODE=false
ALLOW_DEMO_CONTROLS=false
MARKET_DATA_PROVIDER=databento
DATABENTO_DATASET=GLBX.MDP3
DATABENTO_SCHEMA=mbp-1
TOFAUTI_FUTURES=GC,MGC
DATABENTO_PARENT_SYMBOLS=GC=GC.FUT,MGC=MGC.FUT
DATABENTO_API_KEY=SERVER_ONLY_ENTITLED_KEY
ECONOMIC_CALENDAR_PROVIDER=trading_economics
TRADING_ECONOMICS_API_KEY=SERVER_ONLY_LICENSED_KEY
CALENDAR_COUNTRIES=united states
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SERVER_ONLY_KEY
CORS_ORIGINS=https://tofauti.vercel.app
REDIS_ENABLED=false
```

Supabase Edge Functions are appropriate for short, scheduled work such as calendar refreshes. They are not a persistent host for this Python FastAPI process or a continuously connected Databento stream: their request, CPU, and worker-duration limits would make the feed disconnect. Do not use a Vercel Function for the market worker or WebSocket service either.

## 4. Verify Before Publishing

Run this from an operations environment after the API is deployed:

```powershell
.\.venv\Scripts\python.exe scripts\verify_live_engine.py `
  --api-url https://YOUR_FASTAPI_HOST `
  --symbols GC,MGC `
  --databento-schema mbp-1
```

The command checks live mode, Databento provenance, fresh snapshots, healthy Supabase persistence, GC/MGC identity, calendar availability, capabilities, and confirms that the production AI analyst remains disabled rather than pretending to be live.

Only after it passes, set this Vercel environment variable and redeploy:

```text
NEXT_PUBLIC_API_URL=https://YOUR_FASTAPI_HOST
```

The Order Flow page will then subscribe to the source-labelled WebSocket stream. It displays delta, cumulative delta, traded-volume profile, and depth only when the API capability report confirms the relevant exchange feed.

## 5. Post-Launch Operations

- Alert on stale snapshots, stream stops, persistence degradation, provider reconnect gaps, and calendar failures.
- Keep raw market ticks and provider metadata under a documented retention policy.
- Verify contract roll behavior before any continuous-contract interpretation.
- Keep macro direction withheld until all five source-backed Gold drivers are current: USD, real yields, risk sentiment, inflation, and central-bank demand.
- Keep broker execution out of scope.
