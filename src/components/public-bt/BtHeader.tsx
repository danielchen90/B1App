"use client";

// Bible Teachers sticky top nav — an ink band that carries the gold mark on every page
// (the logo's own ground). Desktop shows the primary links + Give; the hamburger is
// ALWAYS present and opens the full popout sidebar (all pages with icons + every
// worship center). Campus pages pass their own give URL; everything else falls back
// to the org's giving link.

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BtBrand } from "./BtBrand";
import { BtSidebar } from "./BtSidebar";
import { BT } from "./btSiteContent";
import { IconMenu } from "./BtIcons";
import type { LocationLink } from "./LocationsMenu";

interface Props {
  campuses: LocationLink[];
  giveUrl?: string | null;
}

const NAV = [
  { label: "About", href: "/about" },
  { label: "Sermons", href: "/sermons" },
  { label: "Locations", href: "/locations" },
  { label: "Connect", href: "/connect" }
];

export const BtHeader: React.FC<Props> = ({ campuses, giveUrl }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pathname = usePathname() || "/";
  // The tenant segment may prefix the path when rendered via the rewrite; compare tails.
  const isActive = (href: string) => (href === "/" ? false : pathname.endsWith(href) || pathname.includes(href + "/"));

  return (
    <>
      <header
        className="bt-dark"
        style={{
          position: "sticky", top: 0, zIndex: 80,
          background: "rgba(18,16,11,0.92)",
          backdropFilter: "saturate(160%) blur(10px)",
          WebkitBackdropFilter: "saturate(160%) blur(10px)",
          borderBottom: "1px solid var(--bt-line-dark)"
        }}
      >
        <div
          style={{
            maxWidth: "var(--bt-maxw)", margin: "0 auto", padding: "10px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16
          }}
        >
          <Link href="/" aria-label="Bible Teachers International home">
            <BtBrand size="sm" dark />
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Desktop links */}
            <nav className="bt-desktop-nav" aria-label="Primary" style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 10 }}>
              {NAV.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={isActive(l.href) ? "bt-active" : undefined}
                  style={{
                    fontWeight: 600, fontSize: "0.92rem", letterSpacing: "0.05em",
                    padding: "9px 13px", borderRadius: 8,
                    color: isActive(l.href) ? "var(--bt-gold-bright)" : "var(--bt-ondark)"
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <a
              className="bt-btn bt-give-cta"
              href={giveUrl || BT.giveUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "10px 20px", fontSize: "0.88rem" }}
            >
              Give
            </a>

            {/* Hamburger — always available; opens the popout sidebar */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              style={{
                background: "none", border: "1px solid var(--bt-line-dark)", borderRadius: 8,
                color: "var(--bt-ondark)", cursor: "pointer", padding: 9, display: "inline-flex", marginLeft: 2
              }}
            >
              <IconMenu size={20} />
            </button>
          </div>
        </div>

        {/* Collapse the inline links under 960px — the sidebar covers everything there. */}
        <style
          dangerouslySetInnerHTML={{
            __html: "@media (max-width: 960px) { .bt-desktop-nav { display: none !important; } }"
          }}
        />
      </header>

      <BtSidebar open={menuOpen} onClose={() => setMenuOpen(false)} campuses={campuses} giveUrl={giveUrl} />
    </>
  );
};
