import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

// Pre-recorded so a preview costs nothing and starts instantly. Metro only bundles static
// require() paths, so every voice in personaVoice.ts needs its own line here.
const CLIPS: Record<string, number> = {
  marin: require('../../assets/voice-previews/marin.mp3'),
  cedar: require('../../assets/voice-previews/cedar.mp3'),
  sage: require('../../assets/voice-previews/sage.mp3'),
  coral: require('../../assets/voice-previews/coral.mp3'),
  verse: require('../../assets/voice-previews/verse.mp3'),
  alloy: require('../../assets/voice-previews/alloy.mp3'),
  ash: require('../../assets/voice-previews/ash.mp3'),
  ballad: require('../../assets/voice-previews/ballad.mp3'),
  echo: require('../../assets/voice-previews/echo.mp3'),
  shimmer: require('../../assets/voice-previews/shimmer.mp3'),
};

// Shown under the picker so the user knows what the sample says
export const PREVIEW_LINE = "Hi, this is how I sound. Whenever you're ready, I'm listening.";

let player: AudioPlayer | null = null;
let finishedSubscription: { remove: () => void } | null = null;
let onStopped: (() => void) | null = null;

const clear = () => {
  finishedSubscription?.remove();
  finishedSubscription = null;
  const callback = onStopped;
  onStopped = null;
  callback?.();
};

export const stopPreview = () => {
  if (!player) return;
  try {
    player.pause();
  } catch (e) {
    // The player was already released
  }
  clear();
};

/**
 * Plays the sample for a voice, replacing any preview already playing. `onFinished` runs when the
 * clip ends or is stopped, so the UI can reset its play button.
 */
export const playPreview = async (voiceId: string, onFinished?: () => void): Promise<void> => {
  const clip = CLIPS[voiceId];
  if (!clip) {
    onFinished?.();
    return;
  }
  stopPreview();

  // The iOS silent switch would otherwise mute the sample, and the user can't tell why
  await setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);

  if (!player) player = createAudioPlayer(clip);
  else player.replace(clip);

  onStopped = onFinished ?? null;
  finishedSubscription = player.addListener('playbackStatusUpdate', status => {
    if (status.didJustFinish) clear();
  });
  await player.seekTo(0).catch(() => undefined);
  player.play();
};

export const releasePreview = () => {
  stopPreview();
  try {
    player?.remove();
  } catch (e) {
    // Already released
  }
  player = null;
};
