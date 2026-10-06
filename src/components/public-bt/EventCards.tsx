// Upcoming events as dated cards: a date block, the title, when and where, and the
// center it belongs to (or "All centers" for network events). Renders nothing when
// the list is empty; callers decide whether to show an empty note. RSC-safe.

import React from "react";
import Link from "next/link";
import type { PublicEvent } from "@/helpers/PublicEventsHelper";
import { IconPin, IconArrowRight } from "./BtIcons";
import { trackAttrs } from "@/lib/analytics";

const CSS = `
.bt-ev { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.bt-ev-card { display: grid; grid-template-columns: 64px 1fr; gap: 16px; padding: 18px; background: var(--bt-paper); border: 1px solid var(--bt-line); border-radius: var(--bt-radius-lg); }
.bt-ev-date { border-radius: 12px; background: var(--bt-gold-soft); color: var(--bt-gold-deep); text-align: center; padding: 8px 0; align-self: start; }
.bt-ev-date b { display: block; font-family: var(--bt-display-font); font-size: 1.8rem; line-height: 1; color: var(--bt-ink); }
.bt-ev-date span { font-size: .72rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
.bt-ev-title { font-family: var(--bt-display-font); font-size: 1.3rem; font-weight: 600; color: var(--bt-ink); line-height: 1.2; }
.bt-ev-when { font-size: .92rem; color: var(--bt-body); margin-top: 4px; }
.bt-ev-where { display: flex; gap: 6px; align-items: center; font-size: .88rem; color: var(--bt-muted); margin-top: 6px; }
.bt-ev-desc { font-size: .92rem; color: var(--bt-body); margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
`;

const fmt = (e: PublicEvent) => {
  const s = new Date(e.start);
  const day = s.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  if (e.allDay) {
    if (e.end) {
      const en = new Date(e.end);
      if (en.toDateString() !== s.toDateString()) return s.toLocaleDateString("en-US", { month: "long", day: "numeric" }) + " to " + en.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    }
    return day;
  }
  return day + " · " + s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

export const EventCards: React.FC<{ events: PublicEvent[]; limit?: number; showCenter?: boolean }> = ({ events, limit, showCenter = true }) => {
  const list = typeof limit === "number" ? events.slice(0, limit) : events;
  if (list.length === 0) return null;
  return (
    <div className="bt-ev">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {list.map((e) => {
        const s = new Date(e.start);
        return (
          <article key={e.id} className="bt-ev-card">
            <div className="bt-ev-date" aria-hidden>
              <span>{s.toLocaleDateString("en-US", { month: "short" })}</span>
              <b>{s.getDate()}</b>
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 className="bt-ev-title">{e.title}</h3>
              <div className="bt-ev-when">{e.repeats ? e.repeats + " · next " : ""}{fmt(e)}</div>
              {showCenter && (
                <div className="bt-ev-where">
                  <IconPin size={14} />
                  {e.campusSlug ? <Link href={"/locations/" + e.campusSlug}>{e.campusName}</Link> : <span>{e.location || "All worship centers"}</span>}
                </div>
              )}
              {e.description && <p className="bt-ev-desc">{e.description}</p>}
              {e.registrationUrl && (
                <a className="bt-link" style={{ marginTop: 8 }} href={e.registrationUrl} {...trackAttrs("event_registration_clicked", { event_id: e.id, event_title: e.title, church_id: e.campusId || null })}>Register <IconArrowRight size={14} /></a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};
