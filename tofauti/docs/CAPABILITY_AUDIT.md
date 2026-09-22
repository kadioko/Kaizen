# Capability Audit

Updated: 2026-09-22

This audit maps common market-intelligence dashboard capabilities to TOFAUTI's verified state. It is a product-scope assessment, not a claim of parity with any third-party product. TOFAUTI uses its own name, visual system, calculations, and documentation.

## Available Publicly Today

| Capability | TOFAUTI status | Evidence boundary |
| --- | --- | --- |
| Live spot price chart | Available for `XAU/USD`, `EUR/USD`, `GBP/USD`, and `USD/JPY` | Server-side provider-reported one-minute OHLC; not GC/MGC futures. |
| Candlestick context | Available | Technical observations use only supplied OHLC bars. |
| Structure and reference levels | Available | Rolling high/low and round-number references; not exchange order-book levels. |
| Range acceptance and rejection | Available | Derived from price bars and named as price action, not liquidity/order flow. |
| War Room timeline | Available | Timestamped source-bar observations, not a simulated replay. |
| Upcoming FOMC risk | Available | Official Federal Reserve dates with `HIGH` expected volatility risk; no direction, price target, or probability. |
| Global trading-session status | Available | Sydney, Tokyo, London, and New York regional time windows with IANA timezone/DST handling; timing only, not a liquidity or volume claim. |
| Personal display timezone | Available on this browser | Device-detected default and manual IANA override; visible bars and timeline times use it. Cloud preference sync is not yet enabled. |
| Effective-use guide | Available | In-product six-step workflow explains how to interpret only the source-backed layers. |
| Data availability labels | Available | Macro direction and true order flow are withheld when unsupported. |

## Implemented but Not Publicly Activated

| Capability | Activation requirement | Guardrail |
| --- | --- | --- |
| GC and MGC streaming futures | Entitled Databento `GLBX.MDP3` key, hosted FastAPI/WebSocket service, provider-health verification | Live screen stays disabled until source timestamps, symbols, reconnection behavior, and data continuity are validated. |
| Exchange-derived buy/sell volume and delta | Live trade/BBO feed from the futures provider | Unmatched trades remain unknown volume; they are never forced into delta. |
| Futures liquidity events and key levels | Persisted live futures stream and verified calculated levels | Evidence must be shown with every calculated event. |
| Full macro calendar | Licensed Trading Economics key and hosted ingestion | Provider importance maps to `LOW`, `MEDIUM`, or `HIGH` expected volatility risk without direction inference. |
| WebSocket War Room | Persistent API host plus `NEXT_PUBLIC_API_URL` | Browser must confirm a live provider health payload before labelling the feed live. |
| Durable snapshots and setup outcomes | Applied Supabase migrations and healthy server-side writes | Setup measurements must be observed before analytics or calibration. |
| Delta histogram, cumulative delta, and traded-volume profile | Entitled exchange trade feed, hosted FastAPI service, and `NEXT_PUBLIC_API_URL` | Computed only from normalized exchange records; unavailable on the public spot feed. |
| Top-ten depth ladder | Entitled Databento `MBP-10` schema, hosted FastAPI service, and verified display rights | Market-by-price only; it is not presented as market-by-order depth or a queue heatmap. |
| GC/MGC observed-outcome analytics | Applied exchange aggregate migration plus healthy Supabase writes | Reports recorded 5/15/30/60-minute MFE, MAE, target and invalidation touches; never a forecast. |
| NQ/MNQ runtime | Explicit live activation, verified provider parent symbols, and CME entitlement/display review | Catalogued but disabled by default; no symbol mapping is guessed. |

## Not Built Yet

| Capability | Planned approach |
| --- | --- |
| Full market-by-order heatmap | Define a source-backed order-book reconstruction, cancellation/queue methodology, retention controls, and display rights. Do not relabel MBP-10 as this. |
| Full macro factor model | Add licensed inputs for USD, real yields, risk sentiment, inflation, and central-bank demand, with freshness and source attribution. The engine withholds direction until all five are available. |
| Multi-market heatmap or breadth view | Add only after active instrument coverage and a documented aggregation method exist. |
| Setup journal, equity curve, and historical backtesting | Persist observed outcomes first; no invented win rate, confidence, or probability. |
| Production AI analyst | Add authenticated server-side retrieval over stored snapshots with citations, rate limits, approval boundaries, and audit logging. |
| Broker execution | Out of scope. TOFAUTI is an analysis and decision-support product, not an execution system. |

## Event-Impact Rule

`LOW`, `MEDIUM`, and `HIGH` mean the expected volatility sensitivity of a scheduled event based on a documented official category or licensed provider importance. They do not predict direction, magnitude, timing precision, a trading outcome, or probability. If a source cannot support an impact label, TOFAUTI must display the event without inventing one.

## Product Integrity Checklist

- Keep spot and futures labels distinct.
- Keep price action, exchange order flow, and macro data distinct.
- Show provider, timestamp, symbol, freshness, and availability with each live layer.
- Preserve raw source data before derived calculations when cloud ingestion is enabled.
- Keep all automated explanations grounded in structured evidence.
- Do not scrape or republish third-party calendar data; see [Calendar Sourcing](CALENDAR_SOURCING.md).
- Do not promise profits or present calculated strength as win probability.
