export const DEFAULT_REMINDER_TIME = '12:00:00';

const REMINDER_TIME_BY_NUDGE: Record<string, string> = {
  morning: '08:00:00',
  moment: DEFAULT_REMINDER_TIME,
  evening: '19:00:00',
};

export const buildDefaultPreferences = (
  nudge?: string | null,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
) => ({
  timezone,
  notification_opt_in: true,
  preferred_reminder_time: (nudge && REMINDER_TIME_BY_NUDGE[nudge]) || DEFAULT_REMINDER_TIME,
  preferred_ai_persona: 'Gentle Guide',
});
