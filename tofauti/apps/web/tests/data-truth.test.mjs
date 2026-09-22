import test from 'node:test';
import assert from 'node:assert/strict';
import { browserDemoSnapshot, alignmentFor, strengthFor, directionFor } from '../lib/browser-demo.ts';
import { parseSnapshot, sourceLabel } from '../lib/market-validation.ts';

const scenarios = ['bearish_liquidity_sweep', 'bullish_reversal', 'mixed', 'macro_divergence', 'full_alignment', 'invalidation'];
for (const scenario of scenarios) {
  test(`${scenario}: every frame has consistent volumes, candles and evidence`, () => {
    for (let frame = 0; frame < 75; frame++) {
      const snapshot = browserDemoSnapshot(scenario, frame);
      assert.deepEqual(snapshot, browserDemoSnapshot(scenario, frame));
      assert.equal(snapshot.price, snapshot.bars.at(-1).close);
      assert.equal(parseSnapshot(snapshot, 'GC'), snapshot);
      let cumulative = 0;
      snapshot.order_flow_buckets.forEach((bucket, i, buckets) => {
        assert.equal(bucket.delta, bucket.buy_volume - bucket.sell_volume);
        assert.equal(bucket.total_volume, bucket.buy_volume + bucket.sell_volume);
        cumulative += bucket.delta;
        assert.equal(bucket.cumulative_delta, cumulative);
        assert.equal(bucket.delta_change, i ? bucket.delta - buckets[i - 1].delta : 0);
        assert.ok(Math.abs(bucket.buy_percentage + bucket.sell_percentage - 100) < 0.11);
        if (i) assert.equal(Date.parse(bucket.start) - Date.parse(buckets[i - 1].start), 300000);
      });
      for (const name of ['macro', 'structure', 'order_flow', 'liquidity', 'alignment']) {
        assert.equal(snapshot[name].strength, strengthFor(snapshot[name].score));
        assert.equal(snapshot[name].direction, directionFor(snapshot[name].score));
      }
      for (const event of snapshot.events) {
        assert.ok(Date.parse(event.timestamp) <= Date.parse(snapshot.timestamp));
        if (event.title.includes('liquidity swept')) {
          assert.equal(event.evidence.returned_inside, true);
          assert.ok(event.evidence.max_excursion > 0);
        }
        if (event.state_after === 'CONFIRMED') assert.match(event.evidence.alignment, /^FULL_/);
      }
    }
  });
}

test('replay completion, invalidation and no-confirmation paths', () => {
  for (const scenario of ['bearish_liquidity_sweep', 'bullish_reversal', 'full_alignment']) assert.equal(browserDemoSnapshot(scenario, 74).war_room_state, 'COMPLETED');
  assert.equal(browserDemoSnapshot('invalidation', 74).setup.status, 'INVALIDATED');
  for (const scenario of ['mixed', 'macro_divergence']) for (let frame = 0; frame < 75; frame++) assert.equal(browserDemoSnapshot(scenario, frame).setup, undefined);
  const first = browserDemoSnapshot('bullish_reversal', 8);
  const later = browserDemoSnapshot('bullish_reversal', 12);
  for (const event of first.events) assert.deepEqual(later.events.find((next) => next.id === event.id), event);
});

test('full alignment requires all four layers and opposite pairs remain mixed', () => {
  const layer = (score) => ({ direction: directionFor(score), score, strength: strengthFor(score), summary: '', evidence: {} });
  assert.equal(alignmentFor(layer(-50), layer(-50), layer(-50), layer(0)).state, 'PARTIAL_BEARISH_ALIGNMENT');
  assert.equal(alignmentFor(layer(0), layer(-50), layer(-50), layer(-50)).state, 'MACRO_DIVERGENCE');
  assert.equal(alignmentFor(layer(-50), layer(-50), layer(50), layer(50)).state, 'ORDERFLOW_DIVERGENCE');
  assert.equal(alignmentFor(layer(-50), layer(-50), layer(-50), layer(-50)).state, 'FULL_BEARISH_ALIGNMENT');
});

test('stream rejects wrong symbol, corrupt metrics and bad candles; missing source stays unverified', () => {
  const snapshot = browserDemoSnapshot('mixed', 3);
  assert.throws(() => parseSnapshot(snapshot, 'MGC'));
  assert.throws(() => parseSnapshot({ ...snapshot, price: NaN }, 'GC'));
  assert.throws(() => parseSnapshot({ ...snapshot, bars: [{ ...snapshot.bars[0], high: 1 }] }, 'GC'));
  const corrupt = structuredClone(snapshot);
  corrupt.order_flow_buckets[0].delta = 1000;
  assert.throws(() => parseSnapshot(corrupt, 'GC'));
  assert.equal(sourceLabel({ ...snapshot, source: undefined }), 'SOURCE UNVERIFIED');
});
