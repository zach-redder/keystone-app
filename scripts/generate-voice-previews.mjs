// One-off: writes assets/voice-previews/{voice}.mp3 with OpenAI TTS. The clips are committed, so
// this only needs to run when a voice is added or the sample line changes.
//   OPENAI_API_KEY=sk-... npm run generate:voice-previews
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VOICES = ['marin', 'cedar', 'sage', 'coral', 'verse', 'alloy', 'ash', 'ballad', 'echo', 'shimmer'];
// Keep in step with PREVIEW_LINE in services/voice/voicePreview.ts
const LINE = "Hi, this is how I sound. Whenever you're ready, I'm listening.";

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error('Set OPENAI_API_KEY first.');
  process.exit(1);
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'voice-previews');
await mkdir(out, { recursive: true });

for (const voice of VOICES) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice,
      input: LINE,
      instructions: 'Warm, calm and natural, like a kind person starting a conversation.',
      response_format: 'mp3',
    }),
  });
  if (!response.ok) {
    console.error(`${voice}: ${response.status} ${await response.text()}`);
    process.exitCode = 1;
    continue;
  }
  await writeFile(join(out, `${voice}.mp3`), Buffer.from(await response.arrayBuffer()));
  console.log(`wrote ${voice}.mp3`);
}
