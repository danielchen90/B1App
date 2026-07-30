"use client";

// Bible Teachers public CAMPUS LIST (Phase 20, Plan 06, MAP-04 + crawlable fallback).
//
// A plain, scannable <ul> of every campus (name / address / service-times / a Link to
// /locations/[slug]). This is DELIBERATELY simple and renders the SAME markup whether or
// not the map island hydrates, so it serves DOUBLE duty:
//   1. the scannable list paired LEFT of the map on desktop (MAP-04), and
//   2. the no-JS / crawlable SEO fallback (MAP-01 fallback / SITE-03) — a visitor with
//      JavaScript disabled, or a crawler, still gets the full address list.
//
// It is marked "use client" ONLY so it can accept the optional hover handlers + activeId
// from the CampusLocator orchestrator to pair with the map (two-way highlight). It has NO
// client-only data dependency — the same list is server-rendered by the /locations page
// and the landing for the crawlable fallback (those mount it as a child of a client
// orchestrator, which Next renders to HTML on the server regardless).

import React from "react";
import Link from "next/link";
import type { LocatorCampus } from "./LocatorMap";

interface Props {
  campuses: LocatorCampus[];
  /** Highlighted campus id (paired with the map). */
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}

export const CampusList: React.FC<Props> = ({ campuses, activeId, onHover, onSelect }) => {
  if (campuses.length === 0) {
    return <p style={{ color: "var(--bt-muted)" }}>Campus locations are coming soon.</p>;
  }

  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}
    >
      {campuses.map((c) => {
        const isActive = activeId === c.id;
        return (
          <li key={c.id}>
            <div
              onMouseEnter={() => onHover?.(c.id)}
              onMouseLeave={() => onHover?.(null)}
              onClick={() => onSelect?.(c.id)}
              style={{
                border: "1px solid " + (isActive ? "var(--bt-gold)" : "var(--bt-line)"),
                borderLeft: "4px solid " + (isActive ? "var(--bt-gold)" : "transparent"),
                borderRadius: "var(--bt-radius)",
                background: isActive ? "var(--bt-surface-alt)" : "var(--bt-surface)",
                padding: "16px 18px",
                cursor: onSelect ? "pointer" : "default",
                transition: "border-color .12s, background .12s"
              }}
            >
              <div
                style={{
                  fontFamily: "var(--bt-heading-font)",
                  fontWeight: 700,
                  fontSize: "1.15rem",
                  marginBottom: 4
                }}
              >
                {c.name}
              </div>
              {c.address && (
                <div style={{ color: "var(--bt-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                  {c.address}
                </div>
              )}
              {c.serviceTimesLabel && (
                <div style={{ color: "var(--bt-muted)", fontSize: "0.88rem", marginTop: 4 }}>
                  {c.serviceTimesLabel}
                </div>
              )}
              {c.slug && (
                <Link
                  href={`/locations/${c.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: "inline-block", marginTop: 10, color: "var(--bt-gold-strong)", fontWeight: 600 }}
                >
                  View campus →
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default CampusList;
