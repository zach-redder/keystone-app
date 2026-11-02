export type DoubtId = 'not_good_enough' | 'pleasing' | 'quit';

export const DOUBTS: { id: DoubtId; text: string }[] = [
  { id: 'not_good_enough', text: "I'm not good enough for this." },
  { id: 'pleasing', text: 'I keep saying yes when I mean no.' },
  { id: 'quit', text: 'I always give up halfway.' },
];

export type PreviewKeys = { values: string[]; goals: string[]; vision: string[] };

const affirm = (id: DoubtId, value?: string): string => {
  switch (id) {
    case 'not_good_enough':
      return value
        ? `Someone who cares about ${value} isn't "not good enough." Doubt is loud right now, but it doesn't get the final say on who you are.`
        : "Doubt is loud right now, but it doesn't get the final say on who you are. You're allowed to be a work in progress.";
    case 'pleasing':
      return value
        ? `Saying yes to everyone costs you ${value}. Honoring it means you're allowed to say no, kindly and without guilt.`
        : "Saying yes to everyone costs you something you care about. You're allowed to say no, kindly and without guilt.";
    case 'quit':
      return value
        ? `Stopping halfway doesn't erase ${value}. You can pick it back up today, because imperfect progress still counts.`
        : "Stopping halfway doesn't erase what you care about. You can pick it back up today, because imperfect progress still counts.";
  }
};

const question = (id: DoubtId, value?: string, goal?: string): string => {
  const anchor = goal ? `"${goal}"` : value ? `living out ${value}` : 'the person you want to become';
  switch (id) {
    case 'not_good_enough':
      return `When you picture ${anchor}, what is one small thing the version of you who already got there would do today?`;
    case 'pleasing':
      return `Whose approval are you protecting, and what would saying no make possible for ${anchor}?`;
    case 'quit':
      return `What is the smallest next step toward ${anchor} that you could finish in ten minutes?`;
  }
};

export const buildPreview = (id: DoubtId, keys: PreviewKeys): { affirm: string; question: string } => {
  const doubt = DOUBTS.some((d) => d.id === id) ? id : DOUBTS[0].id;
  return {
    affirm: affirm(doubt, keys.values[0]),
    question: question(doubt, keys.values[0], keys.goals[0]),
  };
};
