# Kaizen

Kaizen is now structured as a two-area trading product workspace:

- `Kaizen`: the current multi-market paper-trading and review platform
- `OrderFlow Commander`: a new dedicated futures order-flow execution assistant area for MNQ, MES, and GC

The current repository still runs the existing React + TypeScript app, and now includes a documented in-app area for `OrderFlow Commander` so the product direction is visible while we build toward the larger architecture.

## Live App

- Production: `https://kaizen-app-opal.vercel.app`

## Workspace Areas

### Kaizen

Kaizen is the active application area in this repository today. It focuses on:

- paper trading across stocks, crypto, forex, and prediction markets
- technical charting and indicator overlays
- portfolio risk review
- alerts and journaling
- coaching and educational content

### OrderFlow Commander

OrderFlow Commander is a new product area added to the app and docs. Its purpose is to become a manual and semi-automated execution assistant for futures order-flow scalping.

It is designed to help a trader analyze:

- `MNQ`
- `MES`
- `GC`

It is not a financial-advice product and must not promise profits. Its role is to help the user:

- build structured trade plans
- score setups
- manage risk
- journal trades
- review performance

## Current Stack In This Repo

- Frontend: React 19 + TypeScript
- Routing: React Router
- Styling: Tailwind CSS
- Charts: Recharts
- Icons: Lucide React
- Build Tooling: Create React App
- Deployment: Vercel
- Serverless API: Vercel function for Polymarket proxying

## Target Stack For OrderFlow Commander

The requested dedicated OrderFlow Commander build target is:

- Next.js with TypeScript
- Tailwind CSS
- Supabase for auth and database
- Recharts for analytics
- local CSV import support
- responsive design optimized for desktop and tablet
- clean dark trading-dashboard UI

This stack is documented in the repo now, but the current codebase has not yet been fully migrated to Next.js or Supabase.

## Current Core Features

- Paper Trading
  - simulate buy and sell orders with virtual capital
  - trade across stocks, prediction markets, forex, and crypto
  - filter instruments by market type

- Live Polymarket Integration
  - fetches active Polymarket contracts from the Gamma API
  - uses a serverless proxy endpoint at `/api/polymarket`
  - falls back to static prediction markets if the live feed fails

- Technical Charts
  - view candles and indicator overlays
  - supports SMA, EMA, RSI, MACD, Bollinger Bands, and volume

- Risk Score
  - reviews concentration, cash allocation, and diversification
  - accounts for sector and asset-class exposure

- Alerts
  - create price and indicator-based alerts for supported markets

- Trade Journal
  - record notes, strategy context, and emotional state alongside trades

- Coach Experience
  - provides guidance and insights around current positions and market behavior

- Responsive UI
  - optimized for desktop and tablet-first workflows
  - includes a mobile slide-in navigation menu

## OrderFlow Commander Product Specification

The new `OrderFlow Commander` area is now documented in the app and in this README as the next product expansion.

### 1. Authentication

Target:

- Supabase email/password login

### 2. Main Dashboard

The dedicated Commander dashboard should show:

- selected instrument: `MNQ`, `MES`, `GC`
- session: `London`, `New York AM`, `New York PM`, `Asia`
- bias: `Bullish`, `Bearish`, `Neutral`
- current price
- risk-on and risk-off context
- active setup detected
- trade score out of `100`
- status:
  - `No Trade`
  - `Watching`
  - `Setup Forming`
  - `Ready`
  - `In Trade`
  - `Trade Complete`

### 3. Level Manager

The user should be able to add, edit, and delete:

- Demand
- Supply
- VWAP
- POC
- VAH
- VAL
- Premarket imbalance
- Previous day high
- Previous day low
- Overnight high
- Overnight low
- Initial balance high
- Initial balance low

Each level should store:

- instrument
- price
- type
- strength score `1-5`
- notes
- active or inactive toggle

### 4. Order-Flow Input Panel

Manual order-flow input should support:

- timeframe: `M1`, `M3`, `M5`
- open, high, low, close
- delta
- delta change
- volume
- cumulative delta
- aggressive buyers observed: yes or no
- aggressive sellers observed: yes or no
- price continued after aggression: yes or no
- notes

### 5. CSV Import

CSV upload should support:

- `timestamp`
- `instrument`
- `timeframe`
- `open`
- `high`
- `low`
- `close`
- `delta`
- `delta_change`
- `volume`
- `cumulative_delta`

After import, rows should:

- display in a table
- feed setup scoring

### 6. Setup Detection Engine

Setup types to implement:

- Seller Absorption Long
- Buyer Absorption Short
- Bullish Continuation
- Bearish Continuation
- No Trade

#### Seller Absorption Long

Conditions:

- price is near demand, VAL, VWAP, or support
- delta is strongly negative relative to recent average
- price fails to continue lower
- delta improves or flips positive
- price breaks local confirmation high

Output:

- direction: `Long`
- reason: sellers absorbed
- entry trigger: reclaim or break of confirmation high
- stop: below absorption low
- targets: nearest `POC`, `VWAP`, `VAH`, supply, or prior high

#### Buyer Absorption Short

Conditions:

- price is near supply, VAH, resistance, or premarket imbalance
- delta is strongly positive relative to recent average
- price fails to continue higher
- delta weakens or flips negative
- price breaks local confirmation low

Output:

- direction: `Short`
- reason: buyers absorbed
- entry trigger: break of confirmation low
- stop: above absorption high
- targets: nearest `VWAP`, `POC`, `VAL`, demand, or prior low

#### Bullish Continuation

Conditions:

- bias is bullish
- price accepts above a key level
- pullback holds the level
- delta turns positive again

Output:

- long continuation plan

#### Bearish Continuation

Conditions:

- bias is bearish
- price accepts below a key level
- retest fails
- delta turns negative again

Output:

- short continuation plan

#### No Trade

Use when:

- there is no key level
- delta is unclear
- score is low
- risk/reward is poor
- context conflicts

### 7. Scoring Model

Trade scores should be computed from `0` to `100`:

- market context agrees: `20`
- price is at a valid level: `20`
- delta and absorption evidence: `25`
- `M1`, `M3`, `M5` alignment: `15`
- risk/reward `>= 1.5R`: `10`
- good session timing: `10`

Display guidance:

- `80-100`: A-grade
- `70-79`: good, wait for confirmation
- `60-69`: weak, small size or skip
- below `60`: no trade

### 8. Risk Engine

Inputs:

- account size
- risk percentage
- entry price
- stop price
- instrument tick size
- tick value

Outputs:

- risk per contract
- maximum contracts
- total risk
- reward at `TP1` and `TP2`
- R multiple

Default tick sizes:

- `MNQ`: `0.25`
- `MES`: `0.25`
- `GC`: `0.10`

Hard rules:

- max `2` trades per session
- stop trading after `2` losses
- no setup below `70` score
- warning if risk/reward is below `1.5R`
- warning when trading near major news
- user can manually toggle `news risk`

### 9. Trade Plan Generator

When a setup is detected, generate:

- direction
- setup type
- entry trigger
- stop loss
- `TP1`
- `TP2`
- invalidation
- why the trade is valid
- why the trade should be skipped
- risk size
- score

### 10. Journal

Each trade journal entry should support:

- date
- instrument
- session
- setup type
- direction
- entry
- stop
- `TP1`
- `TP2`
- exit
- result in `R`
- profit or loss
- screenshot upload
- mistake tags
- notes
- lessons

Suggested mistake tags:

- chased
- entered before confirmation
- ignored bias
- bad level
- moved stop
- revenge trade
- exited early
- good execution

### 11. Analytics Page

Analytics should show:

- total trades
- win rate
- average R
- profit factor
- best setup type
- worst setup type
- `MNQ`, `MES`, `GC` performance
- long vs short performance
- session performance
- mistake frequency

Use Recharts for visualization.

### 12. UI and UX Direction

The dedicated Commander interface should feel like a professional trading war-room:

- dark mode
- green for bullish
- red for bearish
- yellow for warning
- purple or blue for neutral
- cards for bias, levels, delta, score, and risk
- clean tables
- responsive, but optimized for desktop and tablet

### 13. Safety and Disclaimer

Required disclaimer:

> This application is for educational and journaling purposes only. It does not provide financial advice, guarantee profits, or replace professional risk management. Futures trading involves substantial risk.

### 14. Development Approach

The intended approach is:

- build the manual MVP first
- do not connect live broker execution yet
- use mock data where needed
- keep code modular for later integrations

Planned future integration targets:

- NinjaTrader
- Quantower
- Sierra Chart
- broker or data-feed integrations

## Supported Markets In Kaizen Today

- Stocks
  - major US equities used throughout the current dashboard and paper-trading flows

- Prediction Markets
  - live Polymarket contracts
  - static fallback markets when the live feed is unavailable

- Forex
  - `EURUSD`, `GBPUSD`, `USDJPY`, `USDCHF`, `AUDUSD`, `USDCAD`, `NZDUSD`, `EURGBP`, `EURJPY`, `GBPJPY`

- Crypto
  - `BTCUSD`, `ETHUSD`, `SOLUSD`

## Project Structure

```text
docs/
  orderflow-commander-supabase-schema.sql
public/
  orderflow-commander-sample.csv
src/
  components/
    layout/
  context/
    MarketDataContext.tsx
    ThemeContext.tsx
    TradingContext.tsx
  data/
    articles.ts
    stocks.ts
  pages/
    Dashboard.tsx
    PaperTrade.tsx
    Charts.tsx
    Alerts.tsx
    RiskScore.tsx
    Journal.tsx
    Coach.tsx
    Learn.tsx
    Pricing.tsx
    OrderFlowCommander.tsx
api/
  polymarket.js
```

## Commander Starter Assets

The repo now includes starter assets for the OrderFlow Commander build:

- Supabase schema draft: [docs/orderflow-commander-supabase-schema.sql](./docs/orderflow-commander-supabase-schema.sql)
- Sample CSV import file: [public/orderflow-commander-sample.csv](./public/orderflow-commander-sample.csv)
- Product roadmap and improvement plan: [docs/orderflow-commander-roadmap.md](./docs/orderflow-commander-roadmap.md)

## Local Development

### Prerequisites

- Node.js `18+`
- npm

### Install

```bash
npm install
```

### Start The App

```bash
npm start
```

The app runs at `http://localhost:3000`.

## Available Scripts

### `npm start`

Runs the app in development mode.

### `npm run build`

Creates a production build in the `build` folder.

### `npm test`

Runs the test suite.

## Live Market Data Notes

- The app requests Polymarket data through `/api/polymarket` in production.
- If the proxy or upstream request fails, the UI falls back to static prediction-market instruments.
- Market data refreshes automatically on an interval inside `MarketDataContext`.

## Deployment

The app is configured for Vercel deployment.

- SPA routing is handled in `vercel.json`
- Polymarket proxying is handled by `api/polymarket.js`

Manual deployment with Vercel CLI:

```bash
npx vercel --prod
```

## Important Notes

- Kaizen is a paper-trading product only.
- No live brokerage integration is included.
- The new OrderFlow Commander area is currently a documented product workspace and implementation target, not a completed Next.js or Supabase build yet.
- Be explicit in product copy that neither area gives financial advice or guarantees profits.
