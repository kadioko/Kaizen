# Deployment

## Architecture

Supabase hosts PostgreSQL, Auth, and row-level security. It does not host the long-running FastAPI worker/WebSocket service. Deploy the API as the Docker service in `render.yaml` (or an equivalent persistent container host), then deploy `apps/web` to Vercel.

## 1. Apply the Supabase Migration

From this directory, link the intended project and apply `supabase/migrations/20260912193000_create_tofauti_market_intelligence.sql`:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration uses `tofauti_`-prefixed tables so TOFAUTI can safely share the Kaizen Supabase project. It enables RLS everywhere and only permits authenticated users to access their own profile and watchlist. Market ingestion remains server-only through the service role.

## 2. Deploy FastAPI

Create a Docker web service from this repository with `tofauti` as the service root. Configure these server-only environment variables:

```text
DEMO_MODE=true
REDIS_ENABLED=false
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_KEY
```

Confirm `GET /health` returns `"persistence": "supabase"` before connecting the frontend. Do not use a Vercel Function for this worker: a persistent process is needed for the in-memory demo clock and WebSocket subscriptions.

## 3. Connect Vercel

In the TOFAUTI Vercel project, set:

```text
NEXT_PUBLIC_API_URL=https://YOUR_FASTAPI_HOST
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Redeploy after adding variables. The service-role key belongs only on the API host. If `NEXT_PUBLIC_API_URL` is omitted, the site intentionally uses its clearly labelled browser demo.
