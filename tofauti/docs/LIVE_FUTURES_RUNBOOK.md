# Live Futures Runbook

## Purpose

This runbook activates the hosted TOFAUTI futures engine only after each external source is entitled, configured, and independently verified. It does not authorize broker execution or generate financial advice.

## Required Entitlements

1. Create a Databento server API key with current live access to `GLBX.MDP3` and the CME/COMEX products needed for `GC.FUT` and `MGC.FUT`.
2. Confirm the account's market-data redistribution and display terms cover this application and its intended users. The API key alone does not establish redistribution permission.
3. Create a Trading Economics API credential with economic-calendar access for the intended countries. The application currently defaults to United States events.
4. Keep both credentials server-only. Never put them in Vercel browser variables, source control, screenshots, or support messages.

## Deploy Order

1. Apply the base TOFAUTI Supabase migration and `20260922103000_add_live_provider_provenance.sql` to the Kaizen Supabase project.
2. Create the persistent Docker service from `render.yaml` with the TOFAUTI directory as service root.
3. Set the Databento key, Trading Economics key, Supabase URL, and Supabase service-role key in the host's encrypted environment settings.
4. Deploy the container. It must fail closed if an entitlement variable is absent or if `DEMO_MODE` is true in Databento mode.
5. Query `GET /health` from an authenticated operations environment. Confirm `mode` is `live`, each GC/MGC runtime is `running`, source metadata names `Databento`, the dataset is `GLBX.MDP3`, and persistence is healthy.
6. Query `GET /api/snapshot/GC`, `GET /api/snapshot/MGC`, and `GET /api/calendar`. Verify provider timestamps are recent, symbols are independent, calendar events show timing/actual/forecast values plus source-backed `LOW` / `MEDIUM` / `HIGH` expected-volatility labels, and no `Mock` source text is present.
7. Open one `WS /ws/market/GC` connection from the deployed TOFAUTI origin. Confirm it emits source-stamped updates without CORS or stale-stream errors.
8. Only then add the HTTPS API origin to Vercel as `NEXT_PUBLIC_API_URL`, redeploy the web application, and conduct a visible acceptance check.

## Data-Quality Gates

- `MBP-1` is a top-of-book and trade stream. It does not provide full market-by-order depth.
- Aggressor side in TOFAUTI is an explicit BBO-match inference, not a vendor-provided order-flow label. Unmatched trades remain unknown volume.
- A reconnect gap, provider error, absent snapshot, stale event time, failed persistence write, or mismatch between contract and parent symbol blocks a “live healthy” release.
- The economic calendar supplies timing and released/consensus values. Its `LOW` / `MEDIUM` / `HIGH` label describes documented expected volatility sensitivity, never price direction, move size, a probability, or a trading instruction.
- Full four-layer alignment requires verified directional macro inputs in addition to futures structure, classified order flow, and liquidity evidence. Until then the engine emits incomplete alignment states.

## Operations

- Watch `/health` and alert when a runtime stops, persistence is degraded, provider source metadata reports a reconnect gap or callback error, or latest market event age exceeds the configured operational threshold.
- Retain raw ticks and provider metadata before trusting aggregate statistics. Review exchange licensing and retention obligations before choosing data retention periods.
- Never use the hosted engine to send broker orders. Any future execution adapter needs an independent risk, authorization, and audit design.
