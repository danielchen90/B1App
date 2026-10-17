// Reads the free-text service times centers write ("Sunday", "Mon & Tue", "Mon to Fri",
// "Thursday (2nd & 4th)", "9:00 & 11:00 AM ET") into weekdays and a start time, so a page
// can draw the week and say which gathering comes next. Pure; anything it cannot read is
// left out of the week rather than guessed.

import type { ServiceTime } from "./campusContentTypes";

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_RE = /\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\.?/gi;
const DAY_INDEX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

export interface ParsedServiceTime extends ServiceTime {
  /** Weekdays it meets on, 0 = Sunday. */
  days: number[];
  /** "2nd & 4th", "every other": set when it does not meet every week. */
  cadence: string | null;
  /** Minutes after midnight of the first start, when the time reads cleanly. */
  startMinutes: number | null;
}

export const parseDays = (text: string): number[] => {
  const head = text.replace(/\(.*?\)/g, " ");
  const found = Array.from(head.matchAll(DAY_RE)).map((m) => DAY_INDEX[m[1].toLowerCase()]);
  if (found.length === 2 && /\b(to|through|thru|-|–)\b|\s[-–]\s/i.test(head)) {
    const [a, b] = found;
    const range: number[] = [];
    for (let d = a; ; d = (d + 1) % 7) { range.push(d); if (d === b || range.length > 7) break; }
    return range;
  }
  return Array.from(new Set(found));
};

/** "9:00 & 11:00 AM ET" → 540; "6:30 PM" → 1110; null when no time reads. */
export const parseStartMinutes = (text: string): number | null => {
  const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  const meridiem = (m[3] || text.match(/\b(am|pm)\b/i)?.[1] || "").toLowerCase();
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (h > 23 || min > 59) return null;
  if (meridiem === "pm" && h < 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;
  return h * 60 + min;
};

export const parseServiceTimes = (times: ServiceTime[]): ParsedServiceTime[] =>
  times.map((t) => {
    const cadence = t.day.match(/\(([^)]+)\)/)?.[1]?.trim() || null;
    return { ...t, days: parseDays(t.day), cadence, startMinutes: parseStartMinutes(t.time) };
  });

/** Today's weekday and the minutes past midnight, in the center's zone. */
export const nowIn = (timeZone: string, at: Date = new Date()): { day: number; minutes: number } => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return { day: DAY_INDEX[get("weekday").slice(0, 3).toLowerCase()] ?? 0, minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10) };
};

export interface NextGathering {
  index: number;
  /** 0 = later today, 1 = tomorrow, … */
  inDays: number;
}

/**
 * The weekly gathering that starts next. Times that meet only some weeks are skipped (we
 * cannot tell from "2nd & 4th" alone which week this is); so is anything already started.
 */
export const nextGathering = (parsed: ParsedServiceTime[], now: { day: number; minutes: number }): NextGathering | null => {
  let best: NextGathering | null = null;
  let bestWait = Infinity;
  for (let index = 0; index < parsed.length; index++) {
    const { cadence, startMinutes, days } = parsed[index];
    if (cadence || startMinutes === null) continue;
    for (const d of days) {
      let inDays = (d - now.day + 7) % 7;
      if (inDays === 0 && startMinutes <= now.minutes) inDays = 7;
      const wait = inDays * 1440 + startMinutes - now.minutes;
      if (wait < bestWait) { bestWait = wait; best = { index, inDays }; }
    }
  }
  return best;
};

export const whenLabel = (inDays: number, day: number): string =>
  inDays === 0 ? "Today" : inDays === 1 ? "Tomorrow" : (inDays === 7 ? "Next " : "This ") + WEEKDAYS[day];
