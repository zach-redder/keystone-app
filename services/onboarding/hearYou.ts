import { Intent } from './keySuggestions';
import { PreviewKeys } from './preview';

const TENSION: Record<Intent, string> = {
  self_doubt: 'Doubt tends to show up for people who care about who they are becoming. It is loud, but it is not the whole truth.',
  people_pleasing: 'Saying yes when you mean no is usually a way of caring too much about how others feel. It can quietly cost you.',
  direction: 'Not knowing your direction is not a flaw. It often means you have outgrown the old map.',
  follow_through: 'Starting strong and falling off is deeply human. It usually means the plan had nothing to anchor it.',
};

const GENERIC_TENSION = 'Everyone has moments where doubt gets louder than what they know to be true.';

const HOPE = 'Keystone keeps the values and goals you just chose in front of you, so when doubt gets loud you have something real to come back to.';

export const buildReflection = (
  intent: Intent | undefined,
  keys: PreviewKeys
): { tension: string; keyLines: string[]; hope: string } => {
  const keyLines: string[] = [];
  if (keys.values.length > 0) {
    keyLines.push(`You value ${keys.values.slice(0, 2).join(' and ')}.`);
  }
  if (keys.goals.length > 0) {
    keyLines.push(`You are working toward ${keys.goals[0]}.`);
  }
  return {
    tension: (intent && TENSION[intent]) || GENERIC_TENSION,
    keyLines,
    hope: HOPE,
  };
};
