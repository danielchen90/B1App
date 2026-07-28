// BT per-campus SERVICE TIMES + ADDRESS + DIRECTIONS (Phase 20, Plan 05).
//
// Renders content.serviceTimes (ServiceTime[]: day/time/label) + the campus street
// address as server-rendered CRAWLABLE TEXT (SITE-03) — a plain <address> block, not an
// image or a client-only map — plus a "Get directions" external link built from the
// address (Google Maps). This is CORE info: per the LOCKED mixed empty-state rule it
// ALWAYS shows even when minimal (e.g. address only, or a "service times coming soon"
// line) — it NEVER hides. RSC-safe (pure server render, no client JS).

import React from "react";
import type { ServiceTime } from "./campusContentTypes";

interface Props {
  campusName: string;
  serviceTimes: ServiceTime[];
  address1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export const ServiceTimes: React.FC<Props> = ({ campusName, serviceTimes, address1, city, state, zip }) => {
  const cityLine = [city, state].filter(Boolean).join(", ") + (zip ? " " + zip : "");
  const hasAddress = !!(address1 || city || state || zip);

  // A crawlable, human-readable single-line address for the directions query.
  const directionsQuery = [address1, city, state, zip, campusName].filter(Boolean).join(", ");
  const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(directionsQuery);

  return (
    <div>
      <h2 style={{ fontSize: "2rem", marginBottom: 24 }}>Plan Your Visit</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 28
        }}
      >
        {/* ── Service times (crawlable text; minimal fallback if none) ── */}
        <div>
          <h3 style={{ fontSize: "1.25rem", marginBottom: 12 }}>Service Times</h3>
          {serviceTimes.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {serviceTimes.map((s, i) => (
                <li key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, borderBottom: "1px solid var(--bt-line)", paddingBottom: 10 }}>
                  <span style={{ fontFamily: "var(--bt-heading-font)", fontWeight: 700 }}>{s.day}</span>
                  <span style={{ color: "var(--bt-muted)" }}>
                    {s.time}
                    {s.label ? " · " + s.label : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--bt-muted)" }}>Service times coming soon — reach out and we&apos;ll help you plan a visit.</p>
          )}
        </div>

        {/* ── Address + directions (crawlable <address>; always renders the block) ── */}
        <div>
          <h3 style={{ fontSize: "1.25rem", marginBottom: 12 }}>Location</h3>
          {hasAddress ? (
            <address style={{ fontStyle: "normal", color: "var(--bt-ink)", lineHeight: 1.6 }}>
              <div style={{ fontFamily: "var(--bt-heading-font)", fontWeight: 700 }}>{campusName}</div>
              {address1 && <div>{address1}</div>}
              {cityLine.trim() && <div>{cityLine}</div>}
            </address>
          ) : (
            <p style={{ color: "var(--bt-muted)" }}>{campusName}</p>
          )}
          <a
            className="bt-btn bt-btn-outline"
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop: 16, padding: "10px 20px", fontSize: "0.95rem" }}
          >
            Get Directions
          </a>
        </div>
      </div>
    </div>
  );
};
