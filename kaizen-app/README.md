# Kaizen

Kaizen is a multi-market paper trading platform designed to help you build trading skill without risking real money. The app combines portfolio simulation, technical charting, risk review, alert tracking, journaling, and an AI-style coaching experience in a single dashboard.

It supports traditional equities, cryptocurrencies, forex pairs, and prediction markets. Prediction markets are powered by a live Polymarket feed with a serverless proxy and static fallback support so the app remains usable if the live feed is unavailable.

## Live App

- **Production**: `https://kaizen-app-opal.vercel.app`

## Core Features

- **Paper Trading**
  - simulate buy and sell orders with virtual capital
  - trade across stocks, prediction markets, forex, and crypto
  - filter instruments by market type

- **Live Polymarket Integration**
  - fetches active Polymarket contracts from the Gamma API
  - uses a serverless proxy endpoint at `/api/polymarket`
  - falls back to static prediction markets if the live feed fails

- **Technical Charts**
  - view candles and indicator overlays
  - supports SMA, EMA, RSI, MACD, Bollinger Bands, and volume

- **Risk Score**
  - reviews concentration, cash allocation, and diversification
  - accounts for sector and asset-class exposure

- **Alerts**
  - create price and indicator-based alerts for supported markets

- **Trade Journal**
  - record notes, strategy context, and emotional state alongside trades

- **Coach Experience**
  - provides guidance and insights around current positions and market behavior

- **Responsive UI**
  - optimized for desktop and mobile layouts
  - includes a mobile slide-in navigation menu

## Supported Markets

- **Stocks**
  - major US equities used throughout the dashboard and paper trading flows

- **Prediction Markets**
  - live Polymarket contracts
  - static fallback markets when the live feed is unavailable

- **Forex**
  - 10 major pairs including `EURUSD`, `GBPUSD`, `USDJPY`, `USDCHF`, `AUDUSD`, `USDCAD`, `NZDUSD`, `EURGBP`, `EURJPY`, and `GBPJPY`

- **Crypto**
  - `BTCUSD`, `ETHUSD`, and `SOLUSD`

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tooling**: Create React App
- **Deployment**: Vercel
- **Serverless API**: Vercel function for Polymarket proxying

## Project Structure

```text
src/
  components/
    layout/
  context/
    MarketDataContext.tsx
    ThemeContext.tsx
    TradingContext.tsx
  data/
    stocks.ts
  pages/
    Dashboard.tsx
    PaperTrade.tsx
    Charts.tsx
    Alerts.tsx
    RiskScore.tsx
    Journal.tsx
    Coach.tsx
api/
  polymarket.js
```

## Local Development

### Prerequisites

- **Node.js** 18+
- **npm**

### Install

```bash
npm install
```

### Start the app

```bash
npm start
```

The app will run at `http://localhost:3000`.

## Available Scripts

### `npm start`

Runs the app in development mode.

### `npm run build`

Creates a production build in the `build` folder.

### `npm test`

Runs the test runner in watch mode.

## Live Market Data Notes

- The app requests Polymarket data through `/api/polymarket` in production.
- If the proxy or upstream request fails, the UI falls back to static prediction market instruments.
- Market data refreshes automatically on an interval inside `MarketDataContext`.

## Deployment

The app is configured for Vercel deployment.

- **SPA routing** is handled in `vercel.json`
- **Polymarket proxy** is handled by `api/polymarket.js`

To deploy manually with the Vercel CLI:

```bash
npx vercel --prod
```

## Notes

- This is a paper trading product only.
- No live brokerage integration is included.
- No real money is placed at risk inside the app.
