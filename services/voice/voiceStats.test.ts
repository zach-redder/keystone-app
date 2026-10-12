import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LevelExtractor } from './voiceStats';

const stats = (...entries: any[]) => new Map<string, any>(entries.map((entry, i) => [`id${i}`, entry]));

test('reads mic and AI levels straight from audioLevel', () => {
  const extractor = new LevelExtractor();
  const levels = extractor.update(
    stats(
      { type: 'media-source', kind: 'audio', audioLevel: 0.25 },
      { type: 'inbound-rtp', kind: 'audio', audioLevel: 0.5 },
    ),
    1000,
  );
  assert.deepEqual(levels, { mic: 0.25, ai: 0.5 });
});

test('understands mediaType as well as kind', () => {
  const levels = new LevelExtractor().update(
    stats({ type: 'inbound-rtp', mediaType: 'audio', audioLevel: 0.4 }),
    1000,
  );
  assert.equal(levels.ai, 0.4);
});

test('ignores video stats', () => {
  const levels = new LevelExtractor().update(
    stats({ type: 'inbound-rtp', kind: 'video', audioLevel: 0.9 }),
    1000,
  );
  assert.deepEqual(levels, { mic: 0, ai: 0 });
});

test('falls back to RMS from the energy delta when audioLevel is missing', () => {
  const extractor = new LevelExtractor();
  extractor.update(stats({ type: 'inbound-rtp', kind: 'audio', totalAudioEnergy: 0, totalSamplesDuration: 0 }), 1000);
  const levels = extractor.update(
    stats({ type: 'inbound-rtp', kind: 'audio', totalAudioEnergy: 0.04, totalSamplesDuration: 1 }),
    2000,
  );
  assert.ok(Math.abs(levels.ai - 0.2) < 1e-9, `expected 0.2, got ${levels.ai}`);
});

test('no new samples means silence, not the old value', () => {
  const extractor = new LevelExtractor();
  const sample = { type: 'inbound-rtp', kind: 'audio', totalAudioEnergy: 0.04, totalSamplesDuration: 1 };
  extractor.update(stats(sample), 1000);
  assert.equal(extractor.update(stats(sample), 2000).ai, 0);
});

test('levels are clamped to 0..1 and bad values become 0', () => {
  const levels = new LevelExtractor().update(
    stats(
      { type: 'media-source', kind: 'audio', audioLevel: 7 },
      { type: 'inbound-rtp', kind: 'audio', audioLevel: Number.NaN },
    ),
    1000,
  );
  assert.deepEqual(levels, { mic: 1, ai: 0 });
});

test('an empty report is silence', () => {
  assert.deepEqual(new LevelExtractor().update(new Map(), 1000), { mic: 0, ai: 0 });
});
