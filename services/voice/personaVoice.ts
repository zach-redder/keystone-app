// OpenAI has no endpoint that lists Realtime voices, so the supported set is pinned here.
// Keep it in step with ALLOWED_VOICES in keystone-ai-service/app/utils/voice.py.
export const VOICES = [
  { id: 'marin', label: 'Marin', blurb: 'Warm and clear' },
  { id: 'cedar', label: 'Cedar', blurb: 'Deep and steady' },
  { id: 'sage', label: 'Sage', blurb: 'Calm and measured' },
  { id: 'coral', label: 'Coral', blurb: 'Soft and kind' },
  { id: 'verse', label: 'Verse', blurb: 'Friendly and expressive' },
  { id: 'alloy', label: 'Alloy', blurb: 'Neutral and even' },
  { id: 'ash', label: 'Ash', blurb: 'Grounded and direct' },
  { id: 'ballad', label: 'Ballad', blurb: 'Gentle and melodic' },
  { id: 'echo', label: 'Echo', blurb: 'Smooth and level' },
  { id: 'shimmer', label: 'Shimmer', blurb: 'Bright and light' },
] as const;

export const DEFAULT_VOICE = 'marin';

export const DEFAULT_PERSONA_VOICES: Record<string, string> = {
  'Life Coach': 'marin',
  'Mindful Monk': 'sage',
  'Gentle Guide': 'coral',
  'Supportive Friend': 'verse',
  'Disciplined Mentor': 'cedar',
};

interface PersonaWithVoice {
  name: string;
  voice?: string | null;
}

const isListed = (voice: string | null | undefined): voice is string =>
  !!voice && VOICES.some(item => item.id === voice);

/**
 * The selected persona is stored as one "Name: Description" string, so the voice is looked up by
 * name: the user's custom personas first, then the built-in ones.
 */
export const pickPersonaVoice = (persona: string, customs: PersonaWithVoice[]): string => {
  const name = persona.split(':')[0].trim();
  const custom = customs.find(item => item.name === name);
  if (custom) return isListed(custom.voice) ? custom.voice : DEFAULT_VOICE;
  return DEFAULT_PERSONA_VOICES[name] ?? DEFAULT_VOICE;
};
