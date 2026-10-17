"use client";

// A center's events: the nearest one (within two weeks, or under way) gets a feature card,
// with what is happening now ("Happening now", "Tonight", "Tomorrow"), a live countdown,
// the nights still to come for a series, and Add to calendar / Directions / Register. Any
// later events follow as dated cards. Every date is shown in the center's own time zone;
// the relative words appear once mounted so the server render never disagrees.

import React from "react";
import type { PublicEvent } from "@/helpers/PublicEventsHelper";
import { EventCards } from "./EventCards";
import { IconArrowRight, IconCalendar, IconClock, IconPin } from "./BtIcons";
import { trackAttrs } from "@/lib/analytics";

const CSS = `
.bt-evf { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); border-radius: 24px; background: var(--bt-abyss); color: var(--bt-ondark); box-shadow: 0 30px 60px -40px rgba(12,12,18,.7); }
.bt-evf::before { content: ""; position: absolute; inset: 0; background: radial-gradient(90% 120% at 0% 0%, rgba(240,191,76,.22), transparent 55%), radial-gradient(70% 90% at 100% 100%, rgba(184,145,42,.18), transparent 60%); pointer-events: none; }
.bt-evf-main { position: relative; padding: clamp(26px, 4vw, 44px); display: grid; gap: 16px; align-content: start; }
.bt-evf-side { position: relative; padding: clamp(26px, 4vw, 44px); border-left: 1px solid var(--bt-line-dark); display: grid; gap: 18px; align-content: start; background: rgba(255,255,255,.03); }
.bt-evf-img { position: absolute; inset: 0; background: center / cover no-repeat; opacity: .22; }
.bt-evf-status { display: inline-flex; align-items: center; gap: 8px; justify-self: start; padding: 6px 14px; border-radius: 999px; font-size: .76rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; background: rgba(240,191,76,.14); color: var(--bt-gold-bright); box-shadow: inset 0 0 0 1px rgba(240,191,76,.4); }
.bt-evf-status.live { background: var(--bt-live); color: #fff; box-shadow: none; }
.bt-evf-status.live::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #fff; animation: btPulse 1.4s ease-in-out infinite; }
.bt-root .bt-evf h3 { color: #fff; font-size: clamp(2.3rem, 5vw, 3.6rem); line-height: 1; }
.bt-evf-when { display: flex; align-items: center; gap: 9px; font-size: 1.06rem; color: #fff; }
.bt-evf-when svg, .bt-evf-where svg { color: var(--bt-gold-bright); flex: none; }
.bt-evf-where { display: flex; align-items: center; gap: 9px; color: var(--bt-ondark-muted); }
.bt-evf-desc { color: var(--bt-ondark-muted); max-width: 560px; }
.bt-evf-acts { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
.bt-evf-label { font-size: .74rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--bt-ondark-muted); }
.bt-evf-count { font-family: var(--bt-display-font); font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 600; color: #fff; line-height: 1; }
.bt-evf-nights { display: flex; flex-wrap: wrap; gap: 8px; }
.bt-evf-night { display: grid; justify-items: center; min-width: 58px; padding: 8px 10px; border-radius: 14px; box-shadow: inset 0 0 0 1px var(--bt-line-dark); }
.bt-evf-night b { font-family: var(--bt-display-font); font-size: 1.5rem; line-height: 1; color: #fff; }
.bt-evf-night span { font-size: .7rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--bt-ondark-muted); }
.bt-evf-night.first { background: var(--bt-gold-bright); box-shadow: none; }
.bt-evf-night.first b, .bt-evf-night.first span { color: #1B1408; }
.bt-evf-more { margin-top: 18px; }
@media (max-width: 860px) { .bt-evf { grid-template-columns: 1fr; } .bt-evf-side { border-left: 0; border-top: 1px solid var(--bt-line-dark); } }
`;

const FEATURE_WINDOW_MS = 14 * 86400000;

const dayKey = (d: Date, timeZone: string) => d.toLocaleDateString("en-CA", { timeZone });
const time = (d: Date, timeZone: string) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone });
const longDate = (d: Date, timeZone: string) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone });

/** "Nightly at 7:00 PM · through Saturday, October 18", "Every Wednesday at 6:00 PM", or the one date. */
const whenLine = (e: PublicEvent, timeZone: string): string => {
  const s = new Date(e.start);
  const at = e.allDay ? "" : " at " + time(s, timeZone);
  const occ = e.occurrences || [];
  if (e.repeats && occ.length > 1) {
    const evening = parseInt(s.toLocaleTimeString("en-US", { hour: "numeric", hourCycle: "h23", timeZone }), 10) >= 17;
    const rhythm = e.repeats === "Daily" ? (evening ? "Nightly" : "Daily") : e.repeats;
    const last = new Date(occ[occ.length - 1]);
    // A series still running near the feed's 180-day horizon is open-ended: no "through".
    const ends = last.getTime() - Date.now() < 150 * 86400000;
    return rhythm + at + (ends ? " · through " + longDate(last, timeZone) : "");
  }
  return longDate(s, timeZone) + at;
};

const statusFor = (e: PublicEvent, now: Date, timeZone: string): { text: string; live: boolean } => {
  const s = new Date(e.start);
  const end = new Date(e.end || s.getTime() + 2 * 3600000);
  if (s <= now && now < end) return { text: "Happening now", live: true };
  const today = dayKey(now, timeZone);
  const tomorrow = dayKey(new Date(now.getTime() + 86400000), timeZone);
  const evening = parseInt(s.toLocaleTimeString("en-US", { hour: "numeric", hourCycle: "h23", timeZone }), 10) >= 17;
  if (dayKey(s, timeZone) === today) return { text: e.allDay ? "Today" : evening ? "Tonight" : "Today", live: false };
  if (dayKey(s, timeZone) === tomorrow) return { text: "Tomorrow", live: false };
  return { text: s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone }), live: false };
};

const countdown = (ms: number): string => {
  const mins = Math.max(1, Math.round(ms / 60000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  if (d > 0) return d + (d === 1 ? " day " : " days ") + h + " h";
  if (h > 0) return h + " h " + m + " min";
  return m + " min";
};

/** Google Calendar link for the next occurrence; a series carries its remaining count. */
const calendarUrl = (e: PublicEvent): string => {
  const s = new Date(e.start);
  const end = new Date(e.end || s.getTime() + 2 * 3600000);
  const z = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const occ = e.occurrences || [];
  const params = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: z(s) + "/" + z(end), details: e.description || "", location: e.location || "" });
  if (e.repeats === "Daily" && occ.length > 1 && occ.length <= 31) params.set("recur", "RRULE:FREQ=DAILY;COUNT=" + occ.length);
  return "https://calendar.google.com/calendar/render?" + params.toString();
};

interface Props {
  events: PublicEvent[];
  timeZone: string;
  centerId: string;
}

export const CenterEvents: React.FC<Props> = ({ events, timeZone, centerId }) => {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const first = events[0];
  const featured = first && new Date(first.start).getTime() - Date.now() < FEATURE_WINDOW_MS ? first : null;
  const rest = featured ? events.slice(1) : events;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {featured && (() => {
        const s = new Date(featured.start);
        const end = new Date(featured.end || s.getTime() + 2 * 3600000);
        const status = now ? statusFor(featured, now, timeZone) : { text: s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone }), live: false };
        const nights = (featured.occurrences || []).slice(0, 10).map((o) => new Date(o));
        const mapsUrl = featured.location ? "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(featured.location) : null;
        const track = (action: string) => trackAttrs("event_action_clicked", { event_id: featured.id, event_title: featured.title, church_id: centerId, action });
        return (
          <article className="bt-evf bt-dark bt-reveal">
            <div className="bt-evf-main">
              {featured.image && <div className="bt-evf-img" style={{ backgroundImage: "url('" + featured.image + "')" }} aria-hidden />}
              <span className={"bt-evf-status" + (status.live ? " live" : "")} style={{ position: "relative" }}>{status.text}</span>
              <h3 style={{ position: "relative" }}>{featured.title}</h3>
              <div className="bt-evf-when" style={{ position: "relative" }}><IconClock size={18} />{whenLine(featured, timeZone)}</div>
              {featured.location && <div className="bt-evf-where" style={{ position: "relative" }}><IconPin size={17} />{featured.location}</div>}
              {featured.description && <p className="bt-evf-desc" style={{ position: "relative" }}>{featured.description}</p>}
              <div className="bt-evf-acts" style={{ position: "relative" }}>
                {featured.registrationUrl && <a className="bt-btn" href={featured.registrationUrl} {...trackAttrs("event_registration_clicked", { event_id: featured.id, event_title: featured.title, church_id: centerId })}>Register <IconArrowRight size={16} /></a>}
                <a className={featured.registrationUrl ? "bt-btn bt-btn-outline" : "bt-btn"} href={calendarUrl(featured)} target="_blank" rel="noopener noreferrer" {...track("add_to_calendar")}><IconCalendar size={17} /> Add to calendar</a>
                {mapsUrl && <a className="bt-btn bt-btn-outline" href={mapsUrl} target="_blank" rel="noopener noreferrer" {...track("directions")}><IconPin size={17} /> Directions</a>}
              </div>
            </div>
            <div className="bt-evf-side">
              <div>
                <div className="bt-evf-label">{now && now >= s ? (now < end ? "Ends in" : "Ended") : "Starts in"}</div>
                <div className="bt-evf-count" aria-live="polite">{now ? (now < s ? countdown(s.getTime() - now.getTime()) : now < end ? countdown(end.getTime() - now.getTime()) : "") : time(s, timeZone)}</div>
                <div style={{ color: "var(--bt-ondark-muted)", marginTop: 8 }}>{longDate(s, timeZone)}{featured.allDay ? "" : ", " + time(s, timeZone) + (featured.end ? " to " + time(end, timeZone) : "")}</div>
              </div>
              {nights.length > 1 && (
                <div>
                  <div className="bt-evf-label" style={{ marginBottom: 10 }}>{nights.length === 2 ? "Two nights left" : nights.length + " nights left"}</div>
                  <div className="bt-evf-nights">
                    {nights.map((d, i) => (
                      <div key={d.toISOString()} className={"bt-evf-night" + (i === 0 ? " first" : "")}>
                        <span>{d.toLocaleDateString("en-US", { weekday: "short", timeZone })}</span>
                        <b>{d.toLocaleDateString("en-US", { day: "numeric", timeZone })}</b>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })()}
      {rest.length > 0 && <div className="bt-evf-more bt-reveal"><EventCards events={rest} limit={6} showCenter={false} /></div>}
    </div>
  );
};
