'use client';

import { useEffect, useRef } from 'react';
import { ColorType, createChart, type IChartApi, type ISeriesApi, type IPriceLine, type UTCTimestamp } from 'lightweight-charts';
import type { MarketSnapshot } from '@/lib/types';

export function CandlestickChart({ snapshot }: { snapshot: MarketSnapshot }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);
  const seriesKeyRef = useRef('');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      width: container.clientWidth, height: 330,
      layout: { background: { type: ColorType.Solid, color: '#15111d' }, textColor: '#a7a1b4' },
      grid: { vertLines: { color: 'rgba(255,255,255,.035)' }, horzLines: { color: 'rgba(255,255,255,.035)' } },
      rightPriceScale: { borderColor: 'rgba(255,255,255,.1)' }, timeScale: { borderColor: 'rgba(255,255,255,.1)', timeVisible: true },
    });
    const series = chart.addCandlestickSeries({ upColor: '#45d9a2', downColor: '#fb7185', borderVisible: false, wickUpColor: '#45d9a2', wickDownColor: '#fb7185' });
    chartRef.current = chart;
    seriesRef.current = series;
    const observer = new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth }));
    observer.observe(container);
    return () => { observer.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; linesRef.current = []; seriesKeyRef.current = ''; };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;
    series.setData(snapshot.bars.map((bar) => ({ time: bar.time as UTCTimestamp, open: bar.open, high: bar.high, low: bar.low, close: bar.close })));
    linesRef.current.forEach((line) => series.removePriceLine(line));
    linesRef.current = snapshot.levels.map((level) => series.createPriceLine({ price: level.price, color: level.type === 'Supply' ? 'rgba(251,113,133,.72)' : level.type === 'Demand' ? 'rgba(69,217,162,.72)' : 'rgba(183,156,255,.55)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: level.type }));
    const key = `${snapshot.instrument.symbol}:${snapshot.scenario}:${snapshot.bars[0]?.time}`;
    if (seriesKeyRef.current !== key) { chart.timeScale().fitContent(); seriesKeyRef.current = key; }
  }, [snapshot]);

  return <div ref={containerRef} className="h-[330px] w-full" aria-label={`${snapshot.instrument.symbol} ${snapshot.source?.mode ?? 'unverified'} candlestick chart`} />;
}
