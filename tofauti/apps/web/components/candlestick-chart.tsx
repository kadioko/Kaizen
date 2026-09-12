'use client';

import { useEffect, useRef } from 'react';
import { ColorType, createChart } from 'lightweight-charts';
import type { MarketSnapshot } from '@tofauti/shared-types';

export function CandlestickChart({ snapshot }: { snapshot: MarketSnapshot }) {
  const containerRef = useRef<HTMLDivElement>(null);

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
    series.setData(snapshot.bars.map((bar) => ({ time: bar.time as never, open: bar.open, high: bar.high, low: bar.low, close: bar.close })));
    snapshot.levels.forEach((level) => series.createPriceLine({ price: level.price, color: level.type === 'Supply' ? 'rgba(251,113,133,.72)' : level.type === 'Demand' ? 'rgba(69,217,162,.72)' : 'rgba(183,156,255,.55)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: level.type }));
    chart.timeScale().fitContent();
    const observer = new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth }));
    observer.observe(container);
    return () => { observer.disconnect(); chart.remove(); };
  }, [snapshot]);

  return <div ref={containerRef} className="h-[330px] w-full" aria-label="GC simulated candlestick chart" />;
}
