"use client";

// The message library with filters: series and speaker chips built from the titles
// themselves (classifySermon), so "Friday Night Discipleship" or "Bishop Daniel Chen"
// narrows the grid. Only chips that match more than one message are offered.

import React from "react";
import type { FeedSermon } from "@/helpers/SermonFeedHelper";
import { MessageCard } from "./MessageCard";
import { classifySermon } from "./btSiteContent";
import { track } from "@/lib/analytics";

interface Props {
  sermons: FeedSermon[];
  /** Analytics placement for the cards (library by default). */
  placement?: string;
  /** The worship center whose messages these are, if any. */
  churchId?: string;
}

export const MessageLibrary: React.FC<Props> = ({ sermons, placement = "library", churchId }) => {
  const [filter, setFilter] = React.useState<{ kind: "series" | "speaker"; value: string } | null>(null);
  const tagged = sermons.map((s) => ({ s, meta: classifySermon(s.title) }));

  const count = (key: "series" | "speaker") => {
    const m = new Map<string, number>();
    tagged.forEach(({ meta }) => { const v = meta[key]; if (v) m.set(v, (m.get(v) || 0) + 1); });
    return [...m.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
  };
  const series = count("series");
  const speakers = count("speaker");
  const shown = filter ? tagged.filter(({ meta }) => meta[filter.kind] === filter.value) : tagged;

  const chip = (kind: "series" | "speaker", value: string, n: number) => {
    const on = filter?.kind === kind && filter.value === value;
    return (
      <button
        key={kind + value}
        type="button"
        className="bt-chip"
        aria-pressed={on}
        onClick={() => {
          setFilter(on ? null : { kind, value });
          if (!on) track("message_library_filtered", { filter_kind: kind, filter_value: value, result_count: n });
        }}
        style={on ? { background: "var(--bt-ink)", color: "#fff", boxShadow: "none" } : undefined}
      >
        {value} <span style={{ opacity: 0.6 }}>{n}</span>
      </button>
    );
  };

  return (
    <div>
      {(series.length > 0 || speakers.length > 0) && (
        <div style={{ display: "grid", gap: 10, marginBottom: 26 }}>
          {series.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span className="bt-eyebrow" style={{ marginRight: 4 }}>Series</span>
              {series.map(([v, n]) => chip("series", v, n))}
            </div>
          )}
          {speakers.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span className="bt-eyebrow" style={{ marginRight: 4 }}>Speaker</span>
              {speakers.map(([v, n]) => chip("speaker", v, n))}
            </div>
          )}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 26 }}>
        {shown.map(({ s }) => <MessageCard key={s.videoId} sermon={s} placement={placement} churchId={churchId} />)}
      </div>
    </div>
  );
};
