// BT per-campus UPCOMING EVENTS (Phase 20, Plan 05, EVT-01).
//
// Consumes the display-only PublicCampusEventDTO[] from GET /public/:churchId/:campusId/
// events (20-01) — { id, title, start, end, allDay } — DISPLAY-ONLY: no registration, no
// RSVP, no attendee data (the DTO carries none). Future events, sorted ascending, are
// listed with a dayjs-formatted date.
//
// MIXED EMPTY-STATE: events are NOT core — when the list is empty the page does not render
// this section (guarded upstream) and this component defensively renders NOTHING too. This
// is the graceful empty-state that matters most now: EVT-01's events feed is HELD (the
// membership DB cannot reach the content-DB events table this phase), so the endpoint
// returns [] and this block simply stays hidden. RSC-safe.

import React from "react";
import dayjs from "dayjs";

export interface PublicEvent {
  id: string;
  title: string;
  start: string | number | Date | null;
  end: string | number | Date | null;
  allDay: boolean;
}

interface Props {
  events: PublicEvent[];
}

export const EventsList: React.FC<Props> = ({ events }) => {
  if (!events || events.length === 0) return null; // hide SILENTLY when empty

  const now = Date.now();
  const upcoming = events
    .filter((e) => e.start && dayjs(e.start).valueOf() >= now)
    .sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());

  if (upcoming.length === 0) return null;

  return (
    <div>
      <h2 style={{ fontSize: "2rem", marginBottom: 24 }}>Upcoming Events</h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        {upcoming.map((e) => {
          const d = dayjs(e.start);
          const when = e.allDay ? d.format("dddd, MMMM D, YYYY") : d.format("dddd, MMMM D · h:mm A");
          return (
            <li
              key={e.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                border: "1px solid var(--bt-line)",
                borderRadius: "var(--bt-radius)",
                background: "var(--bt-surface)",
                padding: "18px 22px"
              }}
            >
              <span style={{ fontFamily: "var(--bt-heading-font)", fontWeight: 700, fontSize: "1.1rem" }}>{e.title}</span>
              <span style={{ color: "var(--bt-muted)" }}>{when}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
