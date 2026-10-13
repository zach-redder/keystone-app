// "YYYY-MM-DD" for a moment in the device's local timezone. Streak and calendar days must be
// local days; slicing an ISO string gives the UTC day, which is wrong near midnight off-UTC.
export const localDayKey = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};
