"use client";

// Bible Teachers sticky top nav (Phase 20, Plan 04).
//
// position:sticky; top:0 — BtBrand on the left, primary nav links, the Locations
// dropdown, and a persistent "Give" affordance slot. The give URL is per-campus;
// on the org landing it links to the org-default give (passed as giveUrl). The
// sticky Give slot lives HERE so Plan 20-05's campus pages reuse the same header
// and just pass the campus's give URL. Mobile: the nav collapses behind a
// hamburger and stacks. Client component (hamburger toggle + embedded client
// LocationsMenu); campus data arrives as a plain server-fetched prop.

import React from "react";
import Link from "next/link";
import { BtBrand } from "./BtBrand";
import { LocationsMenu, type LocationLink } from "./LocationsMenu";

interface NavLink { label: string; href: string; }

interface Props {
  campuses: LocationLink[];
  /** Org-default give URL for the landing; campus pages pass their own. Optional — the slot hides if absent. */
  giveUrl?: string | null;
  navLinks?: NavLink[];
}

const DEFAULT_NAV: NavLink[] = [
  { label: "About", href: "#about" },
  { label: "Sermons", href: "#sermons" },
  { label: "Connect", href: "#connect" }
];

export const BtHeader: React.FC<Props> = ({ campuses, giveUrl, navLinks = DEFAULT_NAV }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const giveSlot = giveUrl ? (
    <a
      className="bt-btn"
      href={giveUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ padding: "10px 20px", fontSize: "0.95rem" }}
    >
      Give
    </a>
  ) : null;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--bt-surface)",
        borderBottom: "1px solid var(--bt-line)",
        backdropFilter: "saturate(180%) blur(6px)"
      }}
    >
      <div
        style={{
          maxWidth: "var(--bt-maxw)",
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16
        }}
      >
        <Link href="/" aria-label="Bible Teachers home">
          <BtBrand size="sm" />
        </Link>

        {/* Desktop nav */}
        <nav
          className="bt-desktop-nav"
          style={{ display: "flex", alignItems: "center", gap: 22 }}
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{ fontFamily: "var(--bt-heading-font)", fontWeight: 600, color: "var(--bt-ink)" }}
            >
              {l.label}
            </Link>
          ))}
          <LocationsMenu campuses={campuses} />
          {giveSlot}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="bt-hamburger"
          aria-label="Menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          style={{
            display: "none",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "1.6rem",
            color: "var(--bt-ink)",
            lineHeight: 1
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile collapsed panel */}
      {mobileOpen && (
        <div
          className="bt-mobile-panel"
          style={{
            borderTop: "1px solid var(--bt-line)",
            padding: "12px 20px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              style={{ fontFamily: "var(--bt-heading-font)", fontWeight: 600, padding: "6px 0" }}
            >
              {l.label}
            </Link>
          ))}
          <div style={{ paddingTop: 4 }}>
            <LocationsMenu campuses={campuses} />
          </div>
          {giveSlot && <div style={{ paddingTop: 6 }}>{giveSlot}</div>}
        </div>
      )}

      {/* Responsive toggle: hide desktop nav / show hamburger under 820px. Scoped
          to the BT header classes so it never touches the admin nav. */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@media (max-width: 820px) {" +
            " .bt-desktop-nav { display: none !important; }" +
            " .bt-hamburger { display: inline-flex !important; }" +
            " }"
        }}
      />
    </header>
  );
};
