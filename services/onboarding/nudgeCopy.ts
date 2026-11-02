const LINES: Record<string, string> = {
  morning: 'A gentle check-in each morning to start your day grounded in who you are.',
  moment: 'A nudge around midday, when doubt tends to creep in, to bring you back to what is true.',
  evening: 'A check-in each evening to help you reflect and end the day on your own terms.',
};

const GENERIC_LINE = 'Gentle reminders that bring you back to your values and goals when you need them.';

export const nudgeLine = (nudge?: string | null): string => (nudge && LINES[nudge]) || GENERIC_LINE;
