"use client";

// Worship-center list — the locator's proximity sidebar. When the visitor's location is
// known the list is flat, nearest first, each card carrying a distance badge; otherwise
// it groups by nation. The same markup server-renders as the crawlable no-JS fallback.

import React from "react";
import Link from "next/link";
import type { LocatorCampus } from "./LeafletLocatorMap";
import { IconArrowRight, IconGlobe } from "./BtIcons";

interface Props {
  campuses: LocatorCampus[];
  /** True once the visitor's position resolved — flat nearest-first list w/ distances. */
  byDistance?: boolean;
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}

function formatDistance(km: number): string {
  const miles = km * 0.621371;
  if (miles < 0.1) return "< 0.1 mi";
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles).toLocaleString()} mi`;
}

const Card: React.FC<{
  c: LocatorCampus;
  isActive: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}> = ({ c, isActive, onHover, onSelect }) => (
  <div
    onMouseEnter={() => onHover?.(c.id)}
    onMouseLeave={() => onHover?.(null)}
    onClick={() => onSelect?.(c.id)}
    className="bt-card"
    style={{
      borderColor: isActive ? "var(--bt-gold)" : undefined,
      boxShadow: isActive ? "0 10px 26px rgba(196,160,60,.22)" : undefined,
      background: isActive ? "#FFF9EA" : undefined,
      padding: "16px 18px",
      cursor: onSelect ? "pointer" : "default"
    }}
  >
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
      <span style={{ fontFamily: "var(--bt-display-font)", fontWeight: 600, fontSize: "1.28rem", lineHeight: 1.2 }}>
        {c.virtual ? <IconGlobe size={16} /> : null} {c.name}
      </span>
      {typeof c.distanceKm === "number" && (
        <span
          style={{
            flexShrink: 0, fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.04em",
            color: "var(--bt-gold-deep)", background: "rgba(196,160,60,.12)",
            border: "1px solid rgba(196,160,60,.35)", borderRadius: 999, padding: "3px 10px",
            whiteSpace: "nowrap"
          }}
        >
          {formatDistance(c.distanceKm)}
        </span>
      )}
    </div>
    {c.address && (
      <div style={{ color: "var(--bt-muted)", fontSize: "0.9rem", lineHeight: 1.5, marginTop: 4 }}>
        {c.address}
      </div>
    )}
    {c.serviceTimesLabel && (
      <div style={{ color: "var(--bt-muted)", fontSize: "0.84rem", marginTop: 4 }}>
        {c.serviceTimesLabel}
      </div>
    )}
    {c.slug && (
      <Link
        href={`/locations/${c.slug}`}
        onClick={(e) => e.stopPropagation()}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 10, color: "var(--bt-gold-deep)", fontWeight: 700, fontSize: "0.9rem" }}
      >
        Visit this center <IconArrowRight size={15} />
      </Link>
    )}
  </div>
);

export const CampusList: React.FC<Props> = ({ campuses, byDistance, activeId, onHover, onSelect }) => {
  if (campuses.length === 0) {
    return <p className="bt-muted-text">Worship-center locations are coming soon.</p>;
  }

  if (byDistance) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {campuses.map((c) => (
          <Card key={c.id} c={c} isActive={activeId === c.id} onHover={onHover} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  // Grouped by nation (SSR / no-geolocation view).
  const groups: { country: string; flag: string; items: LocatorCampus[] }[] = [];
  campuses.forEach((c) => {
    const g = groups.find((x) => x.country === c.country);
    if (g) g.items.push(c);
    else groups.push({ country: c.country, flag: c.flag, items: [c] });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {groups.map((g) => (
        <section key={g.country} aria-label={g.country}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
              fontFamily: "var(--bt-eyebrow-font)", fontWeight: 600, fontSize: "0.72rem",
              letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--bt-gold-deep)"
            }}
          >
            <span aria-hidden style={{ fontSize: "0.95rem", letterSpacing: 0 }}>{g.flag}</span>
            {g.country}
            <span aria-hidden style={{ flex: 1, height: 1, background: "var(--bt-line)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {g.items.map((c) => (
              <Card key={c.id} c={c} isActive={activeId === c.id} onHover={onHover} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default CampusList;
