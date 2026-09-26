"use client";

// The events page's list with a center filter: "All", the visitor's own center first
// (remembered in this browser), then every center that has something coming up.
// Network-wide events show under every filter.

import React from "react";
import type { PublicEvent } from "@/helpers/PublicEventsHelper";
import { EventCards } from "./EventCards";
import { useSavedCenter } from "./MyCenter";

export const EventsBrowser: React.FC<{ events: PublicEvent[] }> = ({ events }) => {
  const [saved] = useSavedCenter();
  const [filter, setFilter] = React.useState<string | null>(null);

  const centers = new Map<string, string>();
  events.forEach((e) => { if (e.campusSlug && e.campusName) centers.set(e.campusSlug, e.campusName); });
  const ordered = [...centers.entries()].sort((a, b) => (a[0] === saved ? -1 : b[0] === saved ? 1 : a[1].localeCompare(b[1])));
  const shown = filter ? events.filter((e) => !e.campusSlug || e.campusSlug === filter) : events;

  return (
    <div>
      {ordered.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {[["", "All centers"] as [string, string], ...ordered].map(([slug, name]) => {
            const on = (filter || "") === slug;
            return (
              <button
                key={slug || "all"}
                type="button"
                className="bt-chip"
                aria-pressed={on}
                onClick={() => setFilter(slug || null)}
                style={on ? { background: "var(--bt-ink)", color: "#fff", boxShadow: "none" } : undefined}
              >
                {name}{slug && slug === saved ? " (your center)" : ""}
              </button>
            );
          })}
        </div>
      )}
      <EventCards events={shown} />
    </div>
  );
};
