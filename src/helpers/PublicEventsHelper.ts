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
}

export const loadPublicEvents = cache(async (churchId: string, campusId?: string | null): Promise<PublicEvent[]> => {
  if (!churchId) return [];
  try {
    const q = campusId ? "?campusId=" + encodeURIComponent(campusId) : "";
    const data = await ApiHelper.getAnonymous("/events/public/" + churchId + q, "ContentApi");
    if (!Array.isArray(data)) return [];
    const now = Date.now();
    return (data as PublicEvent[])
      .filter((e) => e && e.start && new Date(e.end || e.start).getTime() >= now - 3600_000)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  } catch {
    return [];
  }
});
