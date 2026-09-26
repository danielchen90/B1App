// Server helper for the public events feed (2026-09 redesign).
//
// Reads GET <ContentApi>/events/public/:churchId[?campusId=] — the anonymous,
// whitelisted list of upcoming events that center admins publish in B1Admin
// (Calendars). Network-wide events have no campus; each center's events carry its
// campus id, name and slug. Never throws: an older API (404) or any failure resolves
// to [] and the events sections simply hide.

import { ApiHelper } from "@churchapps/apphelper";
import { cache } from "react";

export interface PublicEvent {
  id: string;
  title: string;
  description?: string | null;
  start: string;
  end?: string | null;
  allDay?: boolean;
  location?: string | null;
  /** Absent for network-wide events. */
  campusId?: string | null;
  campusName?: string | null;
  campusSlug?: string | null;
  registrationUrl?: string | null;
  image?: string | null;
  /** Set on the single card kept for a repeating event, e.g. "Every Wednesday". */
  repeats?: string | null;
}

/**
 * A weekly class would otherwise fill the list with one card per week. Occurrences of a
 * repeating event arrive with ids "<eventId>:<isoStart>"; keep the next one and describe
 * the rhythm ("Every Wednesday") from the gap between occurrences.
 */
export const collapseRepeats = (events: PublicEvent[]): PublicEvent[] => {
  const groups = new Map<string, PublicEvent[]>();
  const order: string[] = [];
  for (const e of events) {
    const base = e.id.includes(":") ? e.id.split(":")[0] : e.id;
    if (!groups.has(base)) { groups.set(base, []); order.push(base); }
    groups.get(base)!.push(e);
  }
  return order.map((base) => {
    const list = groups.get(base)!;
    if (list.length < 2) return list[0];
    const first = new Date(list[0].start);
    const gapDays = Math.round((new Date(list[1].start).getTime() - first.getTime()) / 86400000);
    const weekday = first.toLocaleDateString("en-US", { weekday: "long" });
    const repeats = gapDays === 7 ? "Every " + weekday : gapDays === 14 ? "Every other " + weekday : gapDays === 1 ? "Daily" : gapDays >= 28 && gapDays <= 31 ? "Monthly" : "Repeats";
    return { ...list[0], repeats };
  });
};

export const loadPublicEvents = cache(async (churchId: string, campusId?: string | null): Promise<PublicEvent[]> => {
  if (!churchId) return [];
  try {
    const q = campusId ? "?campusId=" + encodeURIComponent(campusId) : "";
    const data = await ApiHelper.getAnonymous("/events/public/" + churchId + q, "ContentApi");
    if (!Array.isArray(data)) return [];
    const now = Date.now();
    return collapseRepeats((data as PublicEvent[])
      .filter((e) => e && e.start && new Date(e.end || e.start).getTime() >= now - 3600_000)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
  } catch {
    return [];
  }
});
