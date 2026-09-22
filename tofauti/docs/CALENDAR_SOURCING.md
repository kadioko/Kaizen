# Calendar Sourcing

## Production Source Policy

TOFAUTI needs a licensed, attributable economic-calendar source for timing, event names, importance, actual values, consensus forecasts, revisions, and source metadata. The supported production adapter is `TradingEconomicsCalendarProvider`, which calls the provider's direct API from the server only.

The adapter preserves provider event IDs, UTC timestamps, country, currency, actual, forecast, previous, revision, and source. Provider importance is transparently mapped as `1 = LOW`, `2 = MEDIUM`, and `3 = HIGH` expected volatility impact. This is a timing and sensitivity label only. It is never a price direction, move-size estimate, probability, or trade recommendation.

## Investing.com

Investing.com states that it does not offer a public API because of data-provider contracts. Its official economic-calendar widget may be considered as a separate third-party browser display only after a legal and product review of its current terms. It must not be scraped, used as a backend data source, persisted, normalized into TOFAUTI calculations, or presented as a TOFAUTI-provided calendar without an explicit commercial agreement.

## Forex Factory

Forex Factory's published notices prohibit copying, republishing, or redistributing its calendar schedules and related database without written permission. TOFAUTI must not scrape, ingest, embed, cache, or republish Forex Factory calendar content unless the company has granted a written license that covers the intended use.

## Approved Development Modes

- The public web currently uses the official Federal Reserve FOMC calendar as a narrow, source-linked `HIGH` scheduled-risk reference. It is not a complete economic calendar.
- Local deterministic development can use no calendar provider or fixtures that are clearly labelled as test data and never displayed in the public product.
- Production calendar ingestion requires a server-only Trading Economics credential, an applied Supabase migration, health checks, and source-freshness monitoring.

## Operator Checklist

1. Verify the source plan and redistribution/display terms for the intended audience.
2. Configure the API key only on the persistent FastAPI host.
3. Set `ECONOMIC_CALENDAR_PROVIDER=trading_economics` and verify `/api/calendar` returns attributed data.
4. Confirm each public event shows source, UTC time, data freshness, and `LOW`, `MEDIUM`, or `HIGH` as a non-directional impact category.
5. Keep the directional Gold macro layer withheld until all five independently sourced macro drivers are current.
