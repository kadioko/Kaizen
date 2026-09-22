# Production Activation

This is the required sequence for enabling real GC/MGC exchange intelligence. It is intentionally fail-closed: do not add `NEXT_PUBLIC_API_URL` to Vercel until every validation gate passes.

## 1. Resume And Link Supabase

The Kaizen Supabase project ref is `eohxxjfuvpuublfglcqc`. A personal access token can identify and manage a project, but it cannot replace the interactive project resume action or the database password required by `supabase link` / `supabase db push`.

1. Sign into the Supabase Dashboard as a project owner or administrator.
2. Open the Kaizen project and select **Resume project** if Supabase labels it paused or inactive. Supabase documents that paused projects can be resumed through Studio for up to one year.
3. Wait for the project status to become active and copy its database password from the project owner’s secure record. Do not place that password in source control.
4. From the `tofauti` directory, link the CLI and apply the tracked migrations:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "YOUR_PERSONAL_ACCESS_TOKEN"
npx supabase link --project-ref eohxxjfuvpuublfglcqc
npx supabase db push
```

5. Confirm the base migration plus `20260922103000_add_live_provider_provenance.sql` and `20260922150000_add_exchange_aggregate_storage.sql` appear in the migration history.

The migrations add only `tofauti_`-prefixed market-intelligence tables and source-provenance fields. They do not alter K OG entities.

## 2. Obtain Licensed Provider Access

Configure only server-side credentials:

- An entitled Databento server API key for `GLBX.MDP3` and the desired CME/COMEX products. Confirm market-data display and redistribution terms for TOFAUTI’s audience.
- A Trading Economics key with economic-calendar access for the selected coverage.
- The Supabase project URL and service-role key for ingestion. The service-role key must never be added to Vercel browser variables.

Use `DATABENTO_SCHEMA=mbp-1` first. It supports trades plus top-of-book. Switch to `mbp-10` only after the entitlement is confirmed and the top-ten market-by-price display has passed acceptance testing. Neither schema is a market-by-order heatmap.

## 3. Deploy The Persistent API

Deploy the Docker service using `render.yaml` or an equivalent persistent container host. Configure these values in the host’s encrypted environment settings:

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

Do not use a Vercel Function for the market worker or WebSocket service. A persistent host is required for continuous exchange ingestion.

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
