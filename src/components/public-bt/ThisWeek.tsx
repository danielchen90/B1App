"use client";

// "This week": the ministry's live rhythm in one strip. When the stream schedule is
// entered in the admin (Sermons > Live stream times), each gathering shows its exact
// day and time converted to the VIEWER's own time zone, the next one gets a countdown,
// and a gathering on air right now shows "Live now" with a Watch button. Until then it
// shows the weekly rhythm as the ministry publishes it (BT_RHYTHM), without times.

import React from "react";
import Link from "next/link";
import { EnvironmentHelper } from "@/helpers";
import { BT_RHYTHM } from "./btSiteContent";
import { IconArrowRight } from "./BtIcons";

interface StreamService {
  id?: string;
  label?: string;
  serviceTime?: string;
  earlyStart?: string;
  sermon?: { duration?: number } | null;
}

interface Slot {
  key: string;
  title: string;
  start: Date;
  end: Date;
}

const toSeconds = (mmss?: string): number => {
  if (!mmss) return 0;
  const [m, s] = mmss.split(":").map((n) => parseInt(n, 10));
  return (isNaN(m) ? 0 : m * 60) + (isNaN(s) ? 0 : s);
};

const fmtWhen = (d: Date): string =>
  d.toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" });

const fmtCountdown = (ms: number): string => {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return "in " + mins + " min";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return "in " + hours + " h " + (mins % 60) + " min";
  const days = Math.round(hours / 24);
  return "in " + days + (days === 1 ? " day" : " days");
};

// The church's own content API (EnvironmentHelper applies the page's API base in the
// browser; see app/layout.tsx).
const contentApiBase = (): string => {
  EnvironmentHelper.init();
  return EnvironmentHelper.Common.ContentApi;
};

const CSS = `
.bt-tw { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.bt-tw-item { background: var(--bt-paper); border: 1px solid var(--bt-line); border-radius: var(--bt-radius); padding: 16px 18px; display: grid; gap: 4px; }
.bt-tw-item.is-live { border-color: rgba(201,63,88,.4); box-shadow: 0 0 0 3px rgba(201,63,88,.08); }
.bt-tw-item.is-next { border-color: rgba(184,145,42,.45); }
.bt-tw-days { font-size: .76rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--bt-gold-deep); }
.bt-tw-title { font-family: var(--bt-display-font); font-size: 1.3rem; font-weight: 600; color: var(--bt-ink); line-height: 1.2; }
.bt-tw-detail { font-size: .92rem; color: var(--bt-muted); }
.bt-tw-flag { display: inline-flex; align-items: center; gap: 7px; font-size: .85rem; font-weight: 600; color: var(--bt-live); }
`;

export const ThisWeek: React.FC<{ streamKey: string | null }> = ({ streamKey }) => {
  const [slots, setSlots] = React.useState<Slot[] | null>(null);
  const [now, setNow] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    if (!streamKey) { setSlots([]); return; }
    let active = true;
    fetch(`${contentApiBase()}/preview/data/${streamKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { services?: StreamService[] } | null) => {
        if (!active) return;
        const list: Slot[] = (data?.services || [])
          .filter((s) => s.serviceTime)
          .map((s, i) => {
            const start = new Date(new Date(s.serviceTime as string).getTime() - toSeconds(s.earlyStart) * 1000);
            const end = new Date(new Date(s.serviceTime as string).getTime() + (s.sermon?.duration || 5400) * 1000);
            return { key: s.id || String(i), title: s.label || "Live service", start, end };
          })
          .sort((a, b) => a.start.getTime() - b.start.getTime());
        setSlots(list);
      })
      .catch(() => active && setSlots([]));
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => { active = false; clearInterval(t); };
  }, [streamKey]);

  const scheduled = (slots || []).filter((s) => s.end.getTime() > now).slice(0, 4);
  const nextKey = scheduled.find((s) => s.start.getTime() > now)?.key;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bt-tw">
        {scheduled.length > 0
          ? scheduled.map((s) => {
            const live = s.start.getTime() <= now && now < s.end.getTime();
            const next = s.key === nextKey;
            return (
              <div key={s.key} className={"bt-tw-item" + (live ? " is-live" : next ? " is-next" : "")}>
                {live
                  ? <span className="bt-tw-flag"><span className="bt-live-dot" aria-hidden /> Live now</span>
                  : <span className="bt-tw-days">{fmtWhen(s.start)}</span>}
                <span className="bt-tw-title">{s.title}</span>
                {live
                  ? <Link className="bt-link" href="/watch">Watch now <IconArrowRight size={15} /></Link>
                  : <span className="bt-tw-detail">{next ? "Next up, " + fmtCountdown(s.start.getTime() - now) : "Your local time"}</span>}
              </div>
            );
          })
          : BT_RHYTHM.map((r) => (
            <div key={r.title} className="bt-tw-item">
              <span className="bt-tw-days">{r.days}</span>
              <span className="bt-tw-title">{r.title}</span>
              <span className="bt-tw-detail">{r.detail}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
