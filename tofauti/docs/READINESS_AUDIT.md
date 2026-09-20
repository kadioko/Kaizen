# Readiness Audit - 2026-09-20

## Release Status

TOFAUTI is a simulation MVP with an optional external XAU/USD bar-close reference. It is not ready to claim live GC/MGC order flow, independent MGC analysis, calibrated trading signals or durable user trade history.

## Verified Repairs

- Browser delta now equals buy minus sell volume; cumulative delta is a running sum. Five-minute totals aggregate actual minute inputs, including an explicitly partial current bucket.
- Replay candles and headline price share one path. Events have stable synthetic timestamps, and a sweep requires a crossed level followed by a return inside.
- Full alignment requires all four layers. Strength labels derive from scores; confirmations require full directional alignment. Bullish/bearish completion, mixed no-confirmation and invalidation paths are exercised.
- Backend buckets are grouped by UTC time. Candles enclose both open and close; displayed VWAP matches calculated evidence. MFE and MAE cannot be negative.
- Historical mock queries terminate on bounded ranges. Seeded queries reproduce the same data and timestamps.
- Browser pages share one instrument/scenario/stream through the root workspace provider. Charts retain their instance and zoom between updates.
- Narrow-screen cards can shrink around wide tables; tables scroll within their cards instead of forcing horizontal page overflow.
- REST requests have timeouts. Stream payloads are validated; wrong-symbol or malformed data is rejected. A silent stream is marked stale, with bounded reconnection backoff.
- Simulation provenance is separate from connection status. Macro factors, fixture levels, approximate volume profiles and temporary journals are labelled accordingly.
- Gold reference price and time now come from the same bar. Validation rejects corrupt OHLC, duplicate/future timestamps and unexpected markets. UI age continues to advance between fetches.
- Quote polling uses one request per two minutes, coalesced per instance with CDN caching. Quota failures receive a clear message and 30-minute backoff. No synthetic quote replaces missing external data.
- Shared server scenario reset is disabled by default. CORS/WebSocket origins are configured explicitly. API health exposes persistence failures; one subscriber failure cannot stop the runtime.
- Settings remain reachable without a healthy market connection. Auth failures release pending state, signup redirects back to this app, and duplicate watchlist saves no longer require an absent UPDATE policy.

## Verification

- 11 browser/data-contract regression tests cover all 75 frames of six scenarios, arithmetic, alignment, stable events, malformed inputs and quote timestamps.
- 19 Python tests cover engines, outcomes, persistence failure, historical queries, API startup, REST, GC/MGC WebSockets, CORS and disabled shared mutations.
- ESLint, TypeScript and Next.js production build passed during this audit. Final UI/deployment checks are recorded in the delivery message.
- Live Twelve Data check returned HTTP 429: 2,092 daily credits consumed against an 800-credit limit. Reduced polling cannot restore already-exhausted credits; the provider must reset them. Other apps using the same key share this allowance.

## Remaining Requirements

1. Host the persistent FastAPI service and verify Supabase writes and readback end-to-end, including restart recovery, retention, write retries and instrument seeding for watchlists.
2. Connect an entitled GC/MGC provider. Validate contract rollover, timestamps, venue, trade aggressor classification, genuine minute bars, tick precision and feed gaps before treating any state as live.
3. Replace demo-specific structure/liquidity references and define session/calendar boundaries. Browser and Python engines are separate implementations, not numerical parity guarantees.
4. Persist complete entry snapshots and durable setup histories. Current journal shows the current replay setup; observed target/stop touches are not fills or realized returns.
5. Add a shared server quota budget across instances and apps, provider health monitoring and reliable market-hours/delay metadata.
6. Verify authenticated signup/signin, email redirect allowlists, user isolation and watchlist writes against live Supabase using dedicated test accounts.
7. Validate a real analyst provider with authenticated context, rate limits and audit logging before advertising AI reasoning. The current analyst is deterministic explanation only.
8. Add measured historical replay/backtesting with execution assumptions before performance claims. There is no calibrated win probability.

Public demo users should be able to explore the workflow; they should not infer that simulation readiness means live-trading readiness.
