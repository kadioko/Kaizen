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

## Not Built Yet

| Capability | Planned approach |
| --- | --- |
| Volume profile and order-flow histogram | Build from verified exchange trade data after live ingestion and historical storage. |
| Liquidity heatmap | Define a source-backed futures depth/volume methodology; do not relabel generic price zones as a heatmap. |
| Full macro factor model | Add licensed inputs for USD, real yields, risk sentiment, inflation, and central-bank demand, with freshness and source attribution. |
| Multi-market heatmap or breadth view | Add only after instrument coverage and a documented aggregation method exist. |
| MNQ/NQ and other futures markets | Extend the provider-neutral interface after GC/MGC production validation. |
| Setup journal, equity curve, heatmaps, and historical backtesting | Persist observed outcomes first; no invented win rate, confidence, or probability. |
| AI analyst | Add authenticated server-side retrieval over stored snapshots with citations, rate limits, and audit logging. |
| Broker execution | Out of scope. TOFAUTI is an analysis and decision-support product, not an execution system. |

## Event-Impact Rule

`LOW`, `MEDIUM`, and `HIGH` mean the expected volatility sensitivity of a scheduled event based on a documented official category or licensed provider importance. They do not predict direction, magnitude, timing precision, a trading outcome, or probability. If a source cannot support an impact label, TOFAUTI must display the event without inventing one.

## Product Integrity Checklist

- Keep spot and futures labels distinct.
- Keep price action, exchange order flow, and macro data distinct.
- Show provider, timestamp, symbol, freshness, and availability with each live layer.
- Preserve raw source data before derived calculations when cloud ingestion is enabled.
- Keep all automated explanations grounded in structured evidence.
- Do not promise profits or present calculated strength as win probability.
