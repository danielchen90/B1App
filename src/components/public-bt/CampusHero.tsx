// BT per-campus HERO (Phase 20, Plan 05). Full-bleed hero — campus name + welcome /
// plan-your-visit copy ABOVE THE FOLD (SITE-02). Uses content.heroImage (a FilesManager
// URL resolved server-side; graceful branded fallback when absent) behind a scrim so the
// gold/white brand type reads. Modern-megachurch: brand-first, big type. The org-level
// "We're live now" indicator (SITE-05) sits near the hero. RSC-safe (the live pill is the
// only client island).

import React from "react";
import { LiveIndicator } from "./LiveIndicator";

interface Props {
  campusName: string;
  churchName: string;
  heroImage: string | null;
  welcomeNote: string;
  pastorNote: string;
  giveUrl?: string;
  sermonChannel: string | null;
  streamKey: string | null;
}

export const CampusHero: React.FC<Props> = ({
  campusName,
  churchName,
  heroImage,
  welcomeNote,
  giveUrl,
  streamKey
}) => {
  const copy =
    welcomeNote ||
    `Welcome to ${campusName}. Whoever you are, wherever you're from — we'd love for you to plan your visit and join us.`;

  const bg: React.CSSProperties = heroImage
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.62) 100%), url("${heroImage}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#ffffff"
      }
    : {
        // Graceful fallback: brand banding, no image.
        background: "var(--bt-surface-alt)",
        color: "var(--bt-ink)"
      };

  const onImage = !!heroImage;

  return (
    <section style={{ ...bg, borderBottom: "1px solid var(--bt-line)" }}>
      <div
        style={{
          maxWidth: "var(--bt-maxw)",
          margin: "0 auto",
          padding: "clamp(96px, 16vw, 168px) 20px clamp(72px, 12vw, 120px)",
          textAlign: "center"
        }}
      >
        {/* Org-level live indicator (SITE-05) — renders only while live. */}
        <div style={{ marginBottom: 18, minHeight: 30 }}>
          <LiveIndicator streamKey={streamKey} />
        </div>

        <div
          style={{
            fontFamily: "var(--bt-heading-font)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "0.9rem",
            opacity: 0.85,
            marginBottom: 14
          }}
        >
          {churchName}
        </div>

        <h1 style={{ fontSize: "clamp(2.6rem, 7vw, 4.6rem)", fontWeight: 800, maxWidth: 900, margin: "0 auto", color: "inherit" }}>
          {campusName}
        </h1>

        <p
          style={{
            fontSize: "clamp(1.05rem, 2.4vw, 1.3rem)",
            maxWidth: 660,
            margin: "22px auto 34px",
            lineHeight: 1.6,
            color: onImage ? "rgba(255,255,255,0.92)" : "var(--bt-muted)"
          }}
        >
          {copy}
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <a className="bt-btn" href="#visit">
            Plan Your Visit
          </a>
          {giveUrl && (
            <a
              className={onImage ? "bt-btn bt-btn-outline" : "bt-btn bt-btn-outline"}
              href={giveUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={onImage ? { color: "#fff", borderColor: "#fff" } : undefined}
            >
              Give
            </a>
          )}
        </div>
      </div>
    </section>
  );
};
