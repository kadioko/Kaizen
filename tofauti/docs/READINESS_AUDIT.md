# Readiness Audit - 2026-09-22

## Release Status

TOFAUTI's public web app is a live spot price-action workspace. It is not a live GC/MGC order-flow service, directional macro engine, signal generator, or durable trade journal.

## Verified Public Behavior

- The public app does not mount the browser-replay provider and does not render simulated GC/MGC prices, delta, setup states, developer controls, or replay timeline records.
- `XAU/USD`, `EUR/USD`, `GBP/USD`, and `USD/JPY` use the server-side Twelve Data route. The response validates requested symbol, one-minute interval, positive OHLC, timestamp ordering, duplicate timestamps, and future timestamps.
- The visible latest price and timestamp always come from the same provider bar. Cache and provider-quota failures render an explicit unavailable state; a simulated quote is never substituted.
- Structure, rolling high/low references, round-number references, range acceptance/rejection, and timeline observations are derived from returned OHLC bars only.
- Macro direction is withheld. The only live macro source is the official Federal Reserve FOMC schedule, presented as scheduled risk rather than a market-impact forecast.
- True order flow is withheld. The current feed does not expose exchange trades, volume, aggressor side, delta, cumulative delta, depth, DOM, or liquidity.
- Secondary Macro, Order Flow, Levels, Journal, and Settings routes use the same live source or explicitly state unavailable coverage.

## Verification

- Seven live-data tests cover malformed provider data, source-symbol classification, timestamps, FOMC calendar parsing, live structure/range calculations, and rejection handling without order-flow fields.
- Python engine tests remain for the offline provider-adapter harness.
- ESLint, TypeScript, and Next.js production build must pass before every deployment.

## Remaining Requirements

1. Connect an entitled futures provider for GC/MGC and validate source quality before showing a live futures view.
2. Connect trade-level/exchange data before calculating or displaying order-flow metrics.
3. Connect verified macro sources before assigning any directional macro state.
4. Host durable ingestion and persist raw inputs, snapshots, events, and observed outcomes before enabling a setup journal or performance analytics.
5. Add centralized provider quota budgeting, provider-health telemetry, and market-hours/delay metadata.
6. Validate authenticated user isolation, watchlists, and storage against live Supabase using dedicated test accounts.

Live technical classifications are not financial advice, probabilities, or trade instructions.
