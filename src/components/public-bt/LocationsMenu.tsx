"use client";

// Bible Teachers "Locations" nav dropdown (Phase 20, Plan 04).
//
// Discoverable path #1 to a campus (LOCKED: BOTH this nav dropdown AND the lower
// map/list section on the landing). Each item links to /locations/[slug] — the
// campus detail page itself arrives in Plan 20-05. Client component: it owns the
// open/close interaction only; the campus data is fetched server-side and passed
// down as a plain prop, so no anonymous fetch happens in the browser.

import React from "react";
import Link from "next/link";

export interface LocationLink {
  slug: string | null;
  name: string;
}

interface Props {
  campuses: LocationLink[];
}

export const LocationsMenu: React.FC<Props> = ({ campuses }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Only campuses with a real slug are linkable (a null slug means the backfill
  // hasn't reached that campus — never render /locations/null).
  const linkable = campuses.filter((c) => c.slug && c.slug.length > 0);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          font: "inherit",
          fontFamily: "var(--bt-heading-font)",
          fontWeight: 600,
          color: "var(--bt-ink)",
          padding: "6px 2px"
        }}
      >
        Locations
        <span aria-hidden style={{ fontSize: "0.7em", color: "var(--bt-gold)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            minWidth: 240,
            maxHeight: 360,
            overflowY: "auto",
            background: "var(--bt-surface)",
            border: "1px solid var(--bt-line)",
            borderRadius: "var(--bt-radius)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            padding: 6,
            zIndex: 60
          }}
        >
          {linkable.length === 0 && (
            <div style={{ padding: "10px 12px", color: "var(--bt-muted)", fontSize: "0.9rem" }}>
              Locations coming soon
            </div>
          )}
          {linkable.map((c) => (
            <Link
              key={c.slug}
              role="menuitem"
              href={`/locations/${c.slug}`}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "10px 12px",
                borderRadius: 6,
                color: "var(--bt-ink)",
                fontWeight: 500
              }}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
