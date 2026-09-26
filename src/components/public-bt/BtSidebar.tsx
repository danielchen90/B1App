"use client";

// Popout navigation sidebar — the full site map in one place. Slides in from the right
// over a scrim: primary pages with icons, an expandable "Worship Centers" list (every
// campus with its nation's flag), and the ministry's YouTube + Give actions at the foot.
// Body scroll locks while open; Escape and scrim-click close it.

import React from "react";
import Link from "next/link";
import { BtBrand } from "./BtBrand";
import { BT } from "./btSiteContent";
import { getCampusExtras } from "./btSiteContent";
import type { LocationLink } from "./LocationsMenu";
import {
  IconHome, IconBook, IconPlay, IconPin, IconGift, IconCalendar, IconStep,
  IconClose, IconChevronDown, IconYouTube, IconGlobe, IconUser } from "./BtIcons";
import { useMemberBadge } from "./BtAccountButton";

interface Props {
  open: boolean;
  onClose: () => void;
  campuses: LocationLink[];
  giveUrl?: string | null;
}

const NAV = [
  { label: "Home", href: "/", icon: IconHome },
  { label: "Locations", href: "/locations", icon: IconPin },
  { label: "Watch", href: "/watch", icon: IconPlay },
  { label: "Events", href: "/events", icon: IconCalendar },
  { label: "Next Steps", href: "/next-steps", icon: IconStep },
  { label: "About", href: "/about", icon: IconBook },
  { label: "Give", href: "/give", icon: IconGift }
];

export const BtSidebar: React.FC<Props> = ({ open, onClose, campuses }) => {
  const member = useMemberBadge();
  const [centersOpen, setCentersOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const linkable = campuses.filter((c) => c.slug);

  return (
    <div aria-hidden={!open} style={{ pointerEvents: open ? "auto" : "none" }}>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(24,24,32,0.45)", backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0, transition: "opacity .25s"
        }}
      />
      {/* Panel */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 95,
          width: "min(370px, 94vw)",
          background: "var(--bt-paper)", color: "var(--bt-ink)",
          borderLeft: "1px solid var(--bt-line)",
          transform: open ? "translateX(0)" : "translateX(102%)",
          transition: "transform .3s cubic-bezier(.2,.7,.2,1)",
          display: "flex", flexDirection: "column", outline: "none"
        }}
      >
        {/* Head */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--bt-line)" }}>
          <Link href="/" onClick={onClose} aria-label="Home"><BtBrand size="sm" /></Link>
          <button
            type="button" onClick={onClose} aria-label="Close menu"
            style={{ background: "none", border: "1px solid var(--bt-line)", borderRadius: 8, color: "var(--bt-ink)", cursor: "pointer", padding: 8, display: "inline-flex" }}
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Scrollable middle */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px 20px" }}>
          <nav aria-label="Site pages">
            {NAV.map(({ label, href, icon: Icon }) => (
              <Link
                key={href} href={href} onClick={onClose}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 12px", borderRadius: 10,
                  fontWeight: 600, fontSize: "1.02rem", color: "var(--bt-ink)"
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bt-sunk)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
              >
                <span style={{ color: "var(--bt-gold)", display: "inline-flex" }}><Icon size={20} /></span>
                {label}
              </Link>
            ))}
          </nav>

          {/* Worship Centers expandable */}
          {linkable.length > 0 && (
            <div style={{ marginTop: 10, borderTop: "1px solid var(--bt-line)", paddingTop: 10 }}>
              <button
                type="button"
                onClick={() => setCentersOpen((o) => !o)}
                aria-expanded={centersOpen}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                  background: "none", border: "none", color: "var(--bt-ink)", cursor: "pointer",
                  padding: "13px 12px", fontFamily: "inherit", fontWeight: 600, fontSize: "1.02rem"
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ color: "var(--bt-gold)", display: "inline-flex" }}><IconGlobe size={20} /></span>
                  Worship Centers
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--bt-muted)", background: "var(--bt-sunk)", borderRadius: 999, padding: "2px 9px" }}>
                    {linkable.length}
                  </span>
                </span>
                <span style={{ display: "inline-flex", transform: centersOpen ? "rotate(180deg)" : "none", transition: "transform .2s", color: "var(--bt-muted)" }}>
                  <IconChevronDown size={17} />
                </span>
              </button>
              {centersOpen && (
                <div style={{ padding: "2px 4px 6px 30px" }}>
                  {linkable.map((c) => {
                    const extras = getCampusExtras(c.slug);
                    return (
                      <Link
                        key={c.slug} href={`/locations/${c.slug}`} onClick={onClose}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, fontSize: "0.95rem", color: "var(--bt-muted)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--bt-ink)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--bt-muted)"; }}
                      >
                        <span aria-hidden style={{ fontSize: "0.9rem" }}>{extras?.flag || "📍"}</span>
                        {c.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Foot */}
        <div style={{ padding: "16px 20px 22px", borderTop: "1px solid var(--bt-line)" }}>
          {member.enabled && (
            <Link
              href="/my" onClick={onClose}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 12, borderRadius: 12, background: "var(--bt-gold-soft)", border: "1px solid rgba(184,145,42,.3)", color: "var(--bt-ink)" }}
            >
              <span aria-hidden style={{ width: 36, height: 36, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: member.name ? "var(--bt-ink)" : "var(--bt-paper)", color: member.name ? "#fff" : "var(--bt-gold-deep)", fontWeight: 600 }}>
                {member.name ? member.name.trim().charAt(0).toUpperCase() : <IconUser size={18} />}
              </span>
              <span style={{ display: "grid", lineHeight: 1.25 }}>
                <b style={{ fontWeight: 600 }}>My Church</b>
                <span style={{ fontSize: "0.85rem", color: "var(--bt-muted)" }}>{member.name ? "Your center, classes, serving and giving" : "Sign in with your Mary Banks ID"}</span>
              </span>
            </Link>
          )}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <Link className="bt-btn" href="/give" onClick={onClose} style={{ flex: 1, padding: "12px 18px" }}>
              <IconGift size={17} /> Give
            </Link>
            <Link className="bt-btn bt-btn-outline" href="/watch" onClick={onClose} style={{ flex: 1, padding: "12px 18px" }}>
              <IconYouTube size={17} /> Watch
            </Link>
          </div>
          <p style={{ fontFamily: "var(--bt-display-font)", fontStyle: "italic", fontSize: "0.95rem", color: "var(--bt-muted)", textAlign: "center" }}>
            &ldquo;{BT.commission}&rdquo; &middot; {BT.commissionRef}
          </p>
        </div>
      </aside>
    </div>
  );
};
