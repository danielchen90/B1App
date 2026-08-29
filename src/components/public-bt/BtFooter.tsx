// Shared site footer — the closing ink band. Brand + commission verse, page links,
// worship-center highlights, and the ministry's channels. RSC-safe.

import React from "react";
import Link from "next/link";
import { BtBrand } from "./BtBrand";
import { BT } from "./btSiteContent";
import { getCampusExtras } from "./btSiteContent";
import { IconYouTube, IconArrowRight } from "./BtIcons";
import type { LocationLink } from "./LocationsMenu";

interface Props {
  campuses?: LocationLink[];
  churchName?: string;
}

const PAGES = [
  { label: "About Us", href: "/about" },
  { label: "Sermons", href: "/sermons" },
  { label: "Locations", href: "/locations" },
  { label: "Give", href: "/give" },
  { label: "Connect", href: "/connect" }
];

const colHead: React.CSSProperties = {
  fontFamily: "var(--bt-eyebrow-font)", fontWeight: 600, fontSize: "0.72rem",
  letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--bt-gold-bright)",
  marginBottom: 18
};

const footLink: React.CSSProperties = {
  display: "block", padding: "5px 0", color: "var(--bt-ondark-muted)", fontSize: "0.95rem"
};

export const BtFooter: React.FC<Props> = ({ campuses = [], churchName }) => {
  const highlight = campuses.filter((c) => c.slug).slice(0, 6);
  return (
    <footer className="bt-dark" style={{ marginTop: "auto", background: "var(--bt-abyss)", borderTop: "1px solid var(--bt-line-dark)" }}>
      <div className="bt-section-tight" style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "40px 32px",
            alignItems: "start"
          }}
        >
          {/* Brand + verse */}
          <div style={{ maxWidth: 330 }}>
            <Link href="/" aria-label="Home"><BtBrand size="sm" dark /></Link>
            <p style={{ marginTop: 18, color: "var(--bt-ondark-muted)", fontSize: "0.95rem", lineHeight: 1.7 }}>
              A worldwide fellowship of worship centers devoted to the deep teaching of God&rsquo;s Word.
            </p>
            <p style={{ marginTop: 14, fontFamily: "var(--bt-display-font)", fontStyle: "italic", fontSize: "1.02rem", color: "var(--bt-ondark)" }}>
              &ldquo;{BT.commission}&rdquo;
              <span style={{ display: "block", fontFamily: "var(--bt-eyebrow-font)", fontStyle: "normal", fontSize: "0.68rem", letterSpacing: "0.24em", color: "var(--bt-gold-bright)", marginTop: 6 }}>
                {BT.commissionRef}
              </span>
            </p>
          </div>

          {/* Pages */}
          <nav aria-label="Footer">
            <div style={colHead}>Explore</div>
            {PAGES.map((p) => (
              <Link key={p.href} href={p.href} style={footLink}>{p.label}</Link>
            ))}
          </nav>

          {/* Worship centers */}
          {highlight.length > 0 && (
            <div>
              <div style={colHead}>Worship Centers</div>
              {highlight.map((c) => {
                const extras = getCampusExtras(c.slug);
                return (
                  <Link key={c.slug} href={`/locations/${c.slug}`} style={footLink}>
                    <span aria-hidden style={{ marginRight: 8 }}>{extras?.flag || "📍"}</span>
                    {c.name}
                  </Link>
                );
              })}
              <Link href="/locations" style={{ ...footLink, color: "var(--bt-gold-bright)", display: "inline-flex", alignItems: "center", gap: 7, marginTop: 6, fontWeight: 600 }}>
                All locations <IconArrowRight size={15} />
              </Link>
            </div>
          )}

          {/* Watch + give */}
          <div>
            <div style={colHead}>Stay Connected</div>
            <p style={{ color: "var(--bt-ondark-muted)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: 16 }}>
              Services and discipleship classes stream every week on the ministry&rsquo;s channel.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <a className="bt-btn bt-btn-ghost" href={BT.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "10px 18px", fontSize: "0.9rem" }}>
                <IconYouTube size={17} /> YouTube
              </a>
              <a className="bt-btn" href={BT.giveUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "10px 18px", fontSize: "0.9rem" }}>
                Give Online
              </a>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 56, paddingTop: 22, borderTop: "1px solid var(--bt-line-dark)",
            display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12,
            color: "var(--bt-ondark-muted)", fontSize: "0.85rem"
          }}
        >
          <span>© {new Date().getFullYear()} {churchName || BT.name} · {BT.ministry}</span>
          <span style={{ fontFamily: "var(--bt-eyebrow-font)", letterSpacing: "0.22em", fontSize: "0.68rem", textTransform: "uppercase" }}>
            {BT.tagline}
          </span>
        </div>
      </div>
    </footer>
  );
};
