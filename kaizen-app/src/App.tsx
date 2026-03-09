import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MarketDataProvider } from './context/MarketDataContext';
import { TradingProvider } from './context/TradingContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import PaperTrade from './pages/PaperTrade';
import Charts from './pages/Charts';
import Journal from './pages/Journal';
import RiskScore from './pages/RiskScore';
import Alerts from './pages/Alerts';
import Coach from './pages/Coach';
import Learn from './pages/Learn';
import Pricing from './pages/Pricing';

function App() {
  return (
    <ThemeProvider>
      <MarketDataProvider>
        <TradingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="trade" element={<PaperTrade />} />
                <Route path="charts" element={<Charts />} />
                <Route path="journal" element={<Journal />} />
                <Route path="risk" element={<RiskScore />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="coach" element={<Coach />} />
                <Route path="learn" element={<Learn />} />
                <Route path="pricing" element={<Pricing />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TradingProvider>
      </MarketDataProvider>
    </ThemeProvider>
  );
}

export default App;
