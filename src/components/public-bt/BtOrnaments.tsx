// The site's signature graphic: the gilded meridian — a wireframe globe of thin gold
// arcs, echoing the engraved globe in the ministry's mark. Used LARGE behind the hero
// (rising from the fold like a sunrise) and SMALL as a section ornament. Pure inline
// SVG, stroke = gold tokens, so it inherits the theme and costs no network bytes.

import React from "react";

/**
 * Large hero globe: the upper arc of a graticule sphere. Position absolutely inside a
 * dark band; it fades toward the edges via the built-in gradient stroke.
 */
export const MeridianGlobe: React.FC<{ style?: React.CSSProperties; className?: string }> = ({ style, className }) => (
  <svg
    viewBox="0 0 1200 620"
    fill="none"
    aria-hidden
    className={className}
    style={style}
    preserveAspectRatio="xMidYMax meet"
  >
    <defs>
      <linearGradient id="btGoldFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#EDC368" stopOpacity="0.75" />
        <stop offset="0.55" stopColor="#C4A03C" stopOpacity="0.28" />
        <stop offset="1" stopColor="#C4A03C" stopOpacity="0.05" />
      </linearGradient>
      <radialGradient id="btGlow" cx="0.5" cy="0.1" r="0.75">
        <stop offset="0" stopColor="#EDC368" stopOpacity="0.16" />
        <stop offset="1" stopColor="#EDC368" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* halo */}
    <ellipse cx="600" cy="620" rx="640" ry="600" fill="url(#btGlow)" />
    {/* sphere outline */}
    <circle cx="600" cy="620" r="520" stroke="url(#btGoldFade)" strokeWidth="1.6" />
    {/* meridians */}
    <ellipse cx="600" cy="620" rx="390" ry="520" stroke="url(#btGoldFade)" strokeWidth="1.1" />
    <ellipse cx="600" cy="620" rx="230" ry="520" stroke="url(#btGoldFade)" strokeWidth="1.1" />
    <ellipse cx="600" cy="620" rx="80" ry="520" stroke="url(#btGoldFade)" strokeWidth="1.1" />
    {/* parallels (upper hemisphere only — the visible crown) */}
    <path d="M 140 380 A 520 150 0 0 1 1060 380" stroke="url(#btGoldFade)" strokeWidth="1.1" />
    <path d="M 92 480 A 545 120 0 0 1 1108 480" stroke="url(#btGoldFade)" strokeWidth="1.1" />
    <path d="M 226 260 A 460 190 0 0 1 974 260" stroke="url(#btGoldFade)" strokeWidth="1.1" />
    <path d="M 400 160 A 330 220 0 0 1 800 160" stroke="url(#btGoldFade)" strokeWidth="1.1" />
    {/* polar star point */}
    <circle cx="600" cy="100" r="3" fill="#EDC368" opacity="0.9" />
  </svg>
);

/** Small section ornament: globe glyph flanked by hairlines, centered. */
export const SectionOrnament: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const stroke = dark ? "var(--bt-gold-bright)" : "var(--bt-gold)";
  return (
    <div aria-hidden style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, opacity: 0.8 }}>
      <span style={{ display: "block", width: 54, height: 1, background: `linear-gradient(90deg, transparent, ${stroke})` }} />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.2">
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4.5" ry="9" />
        <path d="M3 12h18" />
      </svg>
      <span style={{ display: "block", width: 54, height: 1, background: `linear-gradient(90deg, ${stroke}, transparent)` }} />
    </div>
  );
};
