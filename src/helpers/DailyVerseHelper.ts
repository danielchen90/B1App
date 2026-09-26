// The day's verse, shared with the Faith Library dashboard (same 365-day calendar,
// served publicly by the Faith Library API). Cached for an hour; any failure hides it.

import { cache } from "react";

const URL = (process.env.DAILY_VERSE_URL || "https://api-server-production-0ecd.up.railway.app/api/bible/daily-verse");

export const loadDailyVerse = cache(async (): Promise<{ reference: string; text: string } | null> => {
  try {
    const res = await fetch(URL, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { verse?: { scripture_reference?: string; scripture_content?: string } };
    const v = data?.verse;
    return v?.scripture_reference && v?.scripture_content ? { reference: v.scripture_reference, text: v.scripture_content } : null;
  } catch {
    return null;
  }
});
