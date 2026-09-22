'use client';

import { useEffect, useRef } from 'react';
import { CandlestickSeries, ColorType, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts';
import type { LiveSpotMarket } from '@/lib/live-spot';

export function LiveSpotChart({ market }: { market: LiveSpotMarket }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 260,
      layout: { background: { type: ColorType.Solid, color: '#15111d' }, textColor: '#a7a1b4' },
      grid: { vertLines: { color: 'rgba(255,255,255,.035)' }, horzLines: { color: 'rgba(255,255,255,.035)' } },
      rightPriceScale: { borderColor: 'rgba(255,255,255,.1)' },
      timeScale: { borderColor: 'rgba(255,255,255,.1)', timeVisible: true },
    });
    chartRef.current = chart;
    seriesRef.current = chart.addSeries(CandlestickSeries, { upColor: '#45d9a2', downColor: '#fb7185', borderVisible: false, wickUpColor: '#45d9a2', wickDownColor: '#fb7185' });
    const observer = new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth }));
    observer.observe(container);
    return () => { observer.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;
    series.setData(market.bars.map((bar) => ({ ...bar, time: bar.time as UTCTimestamp })));
    chart.timeScale().fitContent();
  }, [market]);

  return <div ref={containerRef} className="h-[260px] w-full" aria-label={`${market.market} provider-reported one-minute candlestick chart`} />;
}
