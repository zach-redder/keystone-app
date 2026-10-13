export type DailyMessageBucket = 'new_user' | 'lapsed' | 'affirm_leaning' | 'question_leaning' | 'balanced';

// Share of the last week's chats one mode needs before the daily message leans toward it
const LEANING_SHARE = 0.6;
const LAPSED_AFTER_DAYS = 3;

export const DAILY_MESSAGES: Record<DailyMessageBucket, string[]> = {
  new_user: [
    'Welcome to Keystone. Start with one conversation and see what your keys have to say.',
    'Your keys are set. Talk to your AI today and let them guide the conversation.',
    'Take a minute today to say out loud who you are becoming.',
    'The first conversation is the hardest. Open Keystone and begin.',
    'Your identity keys are waiting. Come see what they bring up.',
  ],
  lapsed: [
    'Missing you! Take a minute to check in with who you are.',
    'Your journey towards authenticity continues. Come back and keep reflecting.',
    'Haven\'t seen you in a while. Your goals are waiting for you.',
    'Ready to get back on track? Your reflection journey misses you.',
    'Take a moment today to reflect on your path. We\'re here to help.',
    'A short conversation is enough to find your footing again.',
    'No pressure, no streak to chase. Just check in with yourself today.',
    'Your keys haven\'t changed. Come back and see how you have.',
  ],
  affirm_leaning: [
    'You have been building yourself up lately. Keep going, and notice what has changed.',
    'Doubt shows up on its own schedule. Meet it with a reminder of who you are.',
    'Take a minute to hear what is already true about you.',
    'Strong keys, steady voice. Come back and reinforce them today.',
    'What is one thing you did this week that proves who you are?',
    'Affirm who you are before the day tests it.',
    'Your values are not a mood. Stop in and put them back in view.',
    'Confidence is built in small conversations. Have one today.',
  ],
  question_leaning: [
    'You have been asking good questions lately. What is the next one?',
    'Is the version of you in your keys the one showing up today? Come find out.',
    'A question you avoid usually has something to teach. Bring it to Keystone.',
    'Curiosity is a kind of courage. Dig a little deeper today.',
    'What would you do today if your future self were watching?',
    'Challenge one assumption about yourself today.',
    'Not every answer comes at once. Bring today\'s question to your AI.',
    'Where do your actions and your keys disagree? Let\'s look at it.',
  ],
  balanced: [
    'Some days call for certainty, others for doubt. Come see which one today needs.',
    'Check in with your keys. Do they still sound like you?',
    'Five minutes with yourself can change the whole day. Open Keystone.',
    'Affirm what is solid. Question what is not. Both start here.',
    'Who do you want to be today? Say it out loud.',
    'Your identity is something you practice. Practice today.',
    'Reflect for a minute before the day takes over.',
    'What is one key you want to live by today?',
  ],
};

export interface DailyMessageContext {
  affirmCount7d: number;
  questionCount7d: number;
  // Whole days since the last chat; null if the user has never chatted
  daysSinceLastChat: number | null;
}

export const pickBucket = ({ affirmCount7d, questionCount7d, daysSinceLastChat }: DailyMessageContext): DailyMessageBucket => {
  if (daysSinceLastChat === null) return 'new_user';
  if (daysSinceLastChat >= LAPSED_AFTER_DAYS) return 'lapsed';

  const total = affirmCount7d + questionCount7d;
  if (total === 0) return 'balanced';
  if (affirmCount7d / total >= LEANING_SHARE) return 'affirm_leaning';
  if (questionCount7d / total >= LEANING_SHARE) return 'question_leaning';
  return 'balanced';
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Same user + same day always gets the same message; consecutive days walk through the pool
// instead of repeating, because the day number is added to a per-user offset.
export const pickDailyMessage = (context: DailyMessageContext, userId: string, date: Date): string => {
  const pool = DAILY_MESSAGES[pickBucket(context)];
  const dayNumber = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / MS_PER_DAY);
  return pool[(hashString(userId) + dayNumber) % pool.length];
};
