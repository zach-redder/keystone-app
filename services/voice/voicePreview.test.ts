import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VOICES } from './personaVoice';

const root = join(__dirname, '..', '..');
const source = readFileSync(join(__dirname, 'voicePreview.ts'), 'utf8');

// Metro only bundles files named in a static require(), so a voice with a clip on disk but no
// entry in voicePreview.ts would silently have no preview.
test('every voice has a bundled preview clip', () => {
  for (const voice of VOICES) {
    assert.ok(
      existsSync(join(root, 'assets', 'voice-previews', `${voice.id}.mp3`)),
      `missing assets/voice-previews/${voice.id}.mp3 (run npm run generate:voice-previews)`,
    );
  }
});

test('every voice clip is registered in voicePreview.ts', () => {
  for (const voice of VOICES) {
    assert.ok(source.includes(`${voice.id}.mp3`), `voicePreview.ts has no require for ${voice.id}`);
  }
});
