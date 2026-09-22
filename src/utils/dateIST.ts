// "Today"/"this month" boundaries are pinned to IST (UTC+5:30, no DST) instead
// of device-local time, so totals stay consistent across the app regardless of
// the device's timezone setting.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 86400000;

// Shifts an instant so its UTC getters read IST wall-clock values.
function ist(date: Date): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

export function istDateString(date: Date = new Date()): string {
  const d = ist(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function istMonthString(date: Date = new Date()): string {
  return istDateString(date).slice(0, 7);
}

export function istDateStringDaysAgo(days: number, date: Date = new Date()): string {
  return istDateString(new Date(date.getTime() - days * DAY_MS));
}

export function istMonthStringMonthsAgo(months: number, date: Date = new Date()): string {
  const d = ist(date);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - months, 1));
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function isSameISTDay(a: Date | string, b: Date | string): boolean {
  return istDateString(new Date(a)) === istDateString(new Date(b));
}

// 'Today' / 'Yesterday' / null (caller formats the date itself otherwise).
export function istRelativeDayLabel(date: Date | string, now: Date = new Date()): 'Today' | 'Yesterday' | null {
  const dStr = istDateString(new Date(date));
  if (dStr === istDateString(now)) return 'Today';
  if (dStr === istDateStringDaysAgo(1, now)) return 'Yesterday';
  return null;
}

export function istDayOfWeek(date: Date | string): number {
  return ist(new Date(date)).getUTCDay();
}

export function istHour(date: Date | string): number {
  return ist(new Date(date)).getUTCHours();
}

export function istDayOfMonth(date: Date | string): number {
  return ist(new Date(date)).getUTCDate();
}

// A stable instant (IST noon) for an IST calendar date string ('YYYY-MM-DD') —
// used when storing a transaction dated in the past, so the stored instant
// doesn't drift to a different IST calendar day.
export function istNoonInstant(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0) - IST_OFFSET_MS);
}
