export type KeyStep = 'core_values' | 'life_goals' | 'future_self_vision';

export const INTENTS = ['self_doubt', 'people_pleasing', 'direction', 'follow_through'] as const;
export type Intent = (typeof INTENTS)[number];

const SUGGESTIONS: Record<Intent, Record<KeyStep, string[]>> = {
  self_doubt: {
    core_values: ['Perseverance', 'Purpose', 'Wisdom'],
    life_goals: ['Freedom', 'Own Business'],
    future_self_vision: ['Stoic', 'Mindful'],
  },
  people_pleasing: {
    core_values: ['Peace', 'Intentionality', 'Balance'],
    life_goals: ['Freedom', 'Work Remote'],
    future_self_vision: ['Minimalist', 'Mindful'],
  },
  direction: {
    core_values: ['Purpose', 'Curiosity', 'Ambition'],
    life_goals: ['Own Business', 'Write Book', 'Travel World'],
    future_self_vision: ['Freelancer', 'Traveler'],
  },
  follow_through: {
    core_values: ['Focus', 'Mastery', 'Stamina'],
    life_goals: ['Run Marathon', 'Six Figure Income'],
    future_self_vision: ['Gym Goer', 'Runner'],
  },
};

export const suggestKeys = (intent: Intent | undefined, step: KeyStep): string[] =>
  (intent && SUGGESTIONS[intent]?.[step]) || [];
