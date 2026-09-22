import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLiveSpotSeries, isLiveSpotSymbol, liveSpotAge } from '../lib/live-spot.ts';
import { nextUpcomingFomcEvents } from '../lib/fomc-schedule.ts';
import { analyzeLivePriceAction } from '../lib/live-price-action.ts';
import { describeActiveSessions, getMarketSessionStatuses } from '../lib/market-sessions.ts';

const now = Date.parse('2026-09-22T12:01:00Z');
const livePayload = (symbol = 'EUR/USD') => ({
  status: 'ok', meta: { symbol, interval: '1min' }, values: [
    { datetime: '2026-09-22 12:00:00', open: '1.18000', high: '1.18100', low: '1.17900', close: '1.18050' },
    { datetime: '2026-09-22 11:59:00', open: '1.17950', high: '1.18020', low: '1.17900', close: '1.18000' },
  ],
});

test('live spot parser preserves the provider market, latest bar, and data boundary', () => {
  const parsed = parseLiveSpotSeries(livePayload(), 'EUR/USD', now);
  assert.equal(parsed.market, 'EUR/USD');
  assert.equal(parsed.asset_class, 'spot_fx');
  assert.equal(parsed.price, 1.1805);
  assert.equal(parsed.as_of, '2026-09-22T12:00:00.000Z');
  assert.equal(parsed.freshness, 'RECENT_BAR');
  assert.match(parsed.limitations.join(' '), /does not contain COMEX futures prices/);
  assert.equal(liveSpotAge(parsed.as_of, now + 361_000), 421);
});

test('live spot parser rejects symbols and corrupted response data', () => {
  assert.equal(isLiveSpotSymbol('XAU/USD'), true);
  assert.equal(isLiveSpotSymbol('GC'), false);
  assert.throws(() => parseLiveSpotSeries(livePayload('GBP/USD'), 'EUR/USD', now));
  const malformed = livePayload();
  malformed.values[0].high = '1.17';
  assert.throws(() => parseLiveSpotSeries(malformed, 'EUR/USD', now));
});

test('each supported spot symbol keeps its own asset classification', () => {
  assert.equal(parseLiveSpotSeries(livePayload('XAU/USD'), 'XAU/USD', now).asset_class, 'spot_metal');
  for (const symbol of ['EUR/USD', 'GBP/USD', 'USD/JPY']) {
    assert.equal(parseLiveSpotSeries(livePayload(symbol), symbol, now).asset_class, 'spot_fx');
  }
});

test('official FOMC parser returns only future published meeting dates', () => {
  const html = `<h4><a id="one">2026 FOMC Meetings</a></h4>
    <div class="row fomc-meeting" ><div class="fomc-meeting__month"><strong>September</strong></div><div class="fomc-meeting__date">15-16*</div></div>
    <div class="row fomc-meeting" ><div class="fomc-meeting__month"><strong>October</strong></div><div class="fomc-meeting__date">27-28</div></div>
    <h4><a id="two">2027 FOMC Meetings</a></h4><div class="row fomc-meeting" ><div class="fomc-meeting__month"><strong>January</strong></div><div class="fomc-meeting__date">26-27</div></div>`;
  const events = nextUpcomingFomcEvents(html, new Date('2026-09-22T12:00:00Z'));
  assert.deepEqual(events.map((event) => event.date), ['2026-10-27', '2027-01-26']);
  assert.equal(events[0].title, 'FOMC meeting');
  assert.equal(events[1].duration_days, 2);
  assert.equal(events[0].expected_volatility_impact, 'HIGH');
  assert.match(events[0].impact_basis, /Direction and magnitude are not estimated/i);
});

test('official FOMC parser rejects unparseable rows instead of inventing calendar events', () => {
  const html = '<h4><a id="one">2027 FOMC Meetings</a></h4><div class="fomc-meeting__month"><strong>Smarch</strong></div><div class="fomc-meeting__date">30-31</div>';
  assert.deepEqual(nextUpcomingFomcEvents(html, new Date('2026-09-22T12:00:00Z')), []);
});

test('global session clock detects the London and New York overlap in local market time', () => {
  const sessions = getMarketSessionStatuses(new Date('2026-09-22T13:00:00Z'));
  assert.deepEqual(sessions.filter((session) => session.active).map((session) => session.id), ['london', 'new-york']);
  assert.equal(describeActiveSessions(sessions), 'London / New York overlap active');
  assert.match(sessions.find((session) => session.id === 'london').localTime, /14:00/);
  assert.match(sessions.find((session) => session.id === 'new-york').localTime, /09:00/);
});

test('global session clock treats regional weekends as closed even when local clock falls in a window', () => {
  const sessions = getMarketSessionStatuses(new Date('2026-09-20T12:00:00Z'));
  assert.equal(sessions.some((session) => session.active), false);
  assert.equal(describeActiveSessions(sessions), 'No defined regional session windows are active');
});

function marketFromBars(bars) {
  return {
    provider: 'Twelve Data', market: 'XAU/USD', asset_class: 'spot_metal', interval: '1min',
    price: bars.at(-1).close, as_of: new Date(bars.at(-1).time * 1000).toISOString(),
    fetched_at: '2026-09-22T12:00:00.000Z', freshness_seconds: 0, freshness: 'RECENT_BAR', bars,
    limitations: [],
  };
}

test('live price-action engine derives structure and range acceptance from supplied OHLC only', () => {
  const bars = Array.from({ length: 30 }, (_, index) => {
    const close = 4000 + index * 0.5;
    return { time: 1_789_776_000 + index * 60, open: close - 0.2, high: close + 0.4, low: close - 0.5, close };
  });
  const analysis = analyzeLivePriceAction(marketFromBars(bars));
  assert.equal(analysis.structure.direction, 'BULLISH');
  assert.equal(analysis.range_interaction.direction, 'BULLISH');
  assert.equal(analysis.alignment, 'STRUCTURE_AND_RANGE_ALIGNED');
  assert.match(analysis.events[0].description, /OHLC|range|source bar/i);
  assert.ok(analysis.levels.every((level) => Number.isFinite(level.price) && level.touches >= 0));
});

test('live price-action engine flags a rejected upper range without calling it order flow', () => {
  const bars = Array.from({ length: 29 }, (_, index) => ({ time: 1_789_776_000 + index * 60, open: 100, high: 100.5, low: 99.5, close: 100 }));
  bars.push({ time: 1_789_776_000 + 29 * 60, open: 100, high: 102, low: 99.4, close: 99.8 });
  const analysis = analyzeLivePriceAction(marketFromBars(bars));
  assert.equal(analysis.range_interaction.direction, 'BEARISH');
  assert.equal(analysis.state, 'RANGE_REJECTION');
  assert.match(analysis.range_interaction.summary, /not exchange liquidity data/i);
  assert.equal('order_flow' in analysis, false);
});
