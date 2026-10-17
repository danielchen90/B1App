"use client";

// A center's weekly rhythm: a seven-day strip (meeting days in gold, today ringed) above a
// card for each gathering, the next one flagged "Next up". Tapping a day highlights its
// gatherings. "Today" and "Next up" are worked out in the center's own time zone after
// mount, so the server render stays stable. An optional aside sits beside the cards.

import React from "react";
import type { ServiceTime } from "./campusContentTypes";
import { WEEKDAYS, nextGathering, nowIn, parseServiceTimes, whenLabel } from "./serviceSchedule";

const CSS = `
.bt-rh { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 22px; align-items: start; }
.bt-rh-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; margin-bottom: 18px; }
.bt-rh-day { display: grid; justify-items: center; gap: 6px; padding: 12px 4px 10px; border-radius: 14px; border: 0; cursor: default; font: inherit;
  background: var(--bt-paper); box-shadow: inset 0 0 0 1px var(--bt-line); color: var(--bt-muted); transition: background-color .25s, box-shadow .25s, transform .25s; }
.bt-rh-day b { font-size: .74rem; letter-spacing: .14em; text-transform: uppercase; font-weight: 600; }
.bt-rh-dots { display: flex; gap: 3px; min-height: 6px; }
.bt-rh-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--bt-gold); }
.bt-rh-day.has { cursor: pointer; background: var(--bt-gold-soft); color: var(--bt-gold-deep); box-shadow: inset 0 0 0 1px rgba(184,145,42,.35); }
.bt-rh-day.has:hover { transform: translateY(-2px); }
.bt-rh-day.today { box-shadow: inset 0 0 0 2px var(--bt-ink); color: var(--bt-ink); }
.bt-rh-day.on { background: var(--bt-ink); color: #fff; box-shadow: none; }
.bt-rh-day.on .bt-rh-dots i { background: var(--bt-gold-bright); }
.bt-rh-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.bt-rh-item { position: relative; padding: 20px 20px 18px; border-radius: var(--bt-radius-lg); background: var(--bt-paper); border: 1px solid var(--bt-line);
  transition: opacity .3s, transform .3s, box-shadow .3s, border-color .3s; }
.bt-rh-item.dim { opacity: .38; }
.bt-rh-item.lit { border-color: rgba(184,145,42,.6); box-shadow: var(--bt-shadow); transform: translateY(-2px); }
.bt-rh-time { font-family: var(--bt-display-font); font-size: 2rem; font-weight: 600; line-height: 1; color: var(--bt-ink); }
.bt-rh-dayline { margin-top: 8px; font-weight: 600; color: var(--bt-ink); }
.bt-rh-label { color: var(--bt-body); font-size: .95rem; }
.bt-rh-tag { display: inline-block; margin-top: 10px; padding: 3px 10px; border-radius: 999px; font-size: .75rem; font-weight: 600; background: var(--bt-sunk); color: var(--bt-muted); }
.bt-rh-next { display: inline-flex; margin-bottom: 12px; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px;
  font-size: .72rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; background: var(--bt-ink); color: var(--bt-gold-bright); animation: btRise .5s ease both; }
.bt-rh-next::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--bt-gold-bright); animation: btPulse 1.6s ease-in-out infinite; }
@media (max-width: 900px) { .bt-rh { grid-template-columns: 1fr; } }
@media (max-width: 460px) { .bt-rh-week { gap: 4px; } .bt-rh-day b { font-size: .64rem; letter-spacing: .06em; } }
`;

/** "Today · 9:00 AM" for the next weekly gathering; the first listed time until mounted. */
export const NextGatheringText: React.FC<{ times: ServiceTime[]; timeZone: string }> = ({ times, timeZone }) => {
  const parsed = React.useMemo(() => parseServiceTimes(times), [times]);
  const [text, setText] = React.useState(times[0] ? times[0].day + " · " + times[0].time : "");
  React.useEffect(() => {
    const now = nowIn(timeZone);
    const next = nextGathering(parsed, now);
    if (next) setText(whenLabel(next.inDays, (now.day + next.inDays) % 7) + " · " + parsed[next.index].time);
  }, [parsed, timeZone]);
  return <>{text}</>;
};

interface Props {
  times: ServiceTime[];
  timeZone: string;
  aside?: React.ReactNode;
}

export const ServiceRhythm: React.FC<Props> = ({ times, timeZone, aside }) => {
  const parsed = React.useMemo(() => parseServiceTimes(times), [times]);
  const [now, setNow] = React.useState<{ day: number; minutes: number } | null>(null);
  const [picked, setPicked] = React.useState<number | null>(null);
  React.useEffect(() => { setNow(nowIn(timeZone)); }, [timeZone]);

  const next = now ? nextGathering(parsed, now) : null;
  const perDay = WEEKDAYS.map((_, d) => parsed.filter((t) => t.days.includes(d)).length);

  return (
    <div className="bt-rh">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div>
        <div className="bt-rh-week" role="group" aria-label="Days we meet">
          {WEEKDAYS.map((name, d) => {
            const has = perDay[d] > 0;
            const cls = ["bt-rh-day", has ? "has" : "", now?.day === d ? "today" : "", picked === d ? "on" : ""].filter(Boolean).join(" ");
            return (
              <button key={name} type="button" className={cls} disabled={!has} aria-pressed={picked === d}
                aria-label={name + (has ? ": " + perDay[d] + (perDay[d] === 1 ? " gathering" : " gatherings") : ": no gatherings") + (now?.day === d ? " (today)" : "")}
                onClick={() => setPicked(picked === d ? null : d)}>
                <b>{name.slice(0, 3)}</b>
                <span className="bt-rh-dots">{Array.from({ length: Math.min(perDay[d], 3) }).map((_, i) => <i key={i} />)}</span>
              </button>
            );
          })}
        </div>
        <div className="bt-rh-list">
          {parsed.map((t, i) => {
            const lit = picked !== null && t.days.includes(picked);
            const cls = ["bt-rh-item", "bt-reveal", lit ? "lit" : "", picked !== null && !lit ? "dim" : ""].filter(Boolean).join(" ");
            const isNext = next?.index === i;
            const nextDay = isNext && now ? (now.day + next!.inDays) % 7 : 0;
            return (
              <article key={i} className={cls} style={{ ["--d" as any]: i }}>
                {isNext && <span className="bt-rh-next">Next up · {whenLabel(next!.inDays, nextDay)}</span>}
                <div className="bt-rh-time">{t.time}</div>
                <div className="bt-rh-dayline">{t.day.replace(/\s*\(.*?\)/, "")}</div>
                {t.label && <div className="bt-rh-label">{t.label}</div>}
                {t.cadence && <span className="bt-rh-tag">{t.cadence}</span>}
              </article>
            );
          })}
        </div>
      </div>
      {aside}
    </div>
  );
};
