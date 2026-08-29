// Bible Teachers International — public brand theme.
//
// The look is derived from the ministry's actual mark: an engraved gold globe ringed by
// Trajan-style capitals on black. The site translates that into three materials:
//   INK   — warm near-black bands (hero, world map, footer), the logo's ground
//   IVORY — warm parchment page ground (Bible paper), where reading happens
//   GOLD  — one metallic accent, used as hairline + type + button, never as decoration
//
// Type system:
//   Display  — Cormorant Garamond (scholarly serif; the teaching voice)
//   Eyebrow  — Cinzel letterspaced caps (echoes the engraved ring of the logo)
//   Body     — Mulish (clean humanist sans)
//
// All vars scoped to `.bt-root` (never :root) so nothing leaks into the Huro admin.

import React from "react";

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2" +
  "?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500" +
  "&family=Cinzel:wght@500;600" +
  "&family=Mulish:wght@400;500;600;700;800" +
  "&display=swap";

const BT_VARS = [
  // ground + surfaces
  "--bt-ivory: #FAF6EC;",
  "--bt-paper: #FFFEF9;",
  "--bt-abyss: #12100B;",
  "--bt-abyss-2: #1D1912;",
  // ink + text
  "--bt-ink: #221D14;",
  "--bt-muted: #6E6350;",
  "--bt-ondark: #F4EDDD;",
  "--bt-ondark-muted: #B3A78B;",
  // gold
  "--bt-gold: #C4A03C;",
  "--bt-gold-bright: #EDC368;",
  "--bt-gold-deep: #8F701F;",
  // hairlines
  "--bt-line: #E6DCC6;",
  "--bt-line-dark: rgba(237,195,104,0.22);",
  // geometry
  "--bt-radius: 8px;",
  "--bt-radius-lg: 16px;",
  "--bt-maxw: 1180px;",
  // type
  "--bt-display-font: 'Cormorant Garamond', Georgia, serif;",
  "--bt-eyebrow-font: 'Cinzel', 'Trajan Pro', serif;",
  "--bt-body-font: 'Mulish', system-ui, sans-serif;",
  // kept for older components that still read these
  "--bt-bg: var(--bt-ivory);",
  "--bt-surface: var(--bt-paper);",
  "--bt-surface-alt: #F3EDDD;",
  "--bt-gold-strong: var(--bt-gold-deep);",
  "--bt-gold-ink: #171204;",
  "--bt-heading-font: var(--bt-display-font);"
].join(" ");

const BT_CSS = `
.bt-root { ${BT_VARS}
  background: var(--bt-ivory); color: var(--bt-ink);
  font-family: var(--bt-body-font); font-size: 16.5px; line-height: 1.65;
  -webkit-font-smoothing: antialiased; }
.bt-root *, .bt-root *::before, .bt-root *::after { box-sizing: border-box; }
.bt-root h1, .bt-root h2, .bt-root h3 {
  font-family: var(--bt-display-font); font-weight: 600; color: inherit;
  letter-spacing: 0; line-height: 1.08; margin: 0; }
.bt-root h4, .bt-root h5 { font-family: var(--bt-body-font); font-weight: 700; margin: 0; }
.bt-root a { color: inherit; text-decoration: none; }
.bt-root p { margin: 0; }
.bt-root img { max-width: 100%; }
.bt-root :focus-visible { outline: 2px solid var(--bt-gold); outline-offset: 3px; }

/* ── Eyebrow: engraved-ring caps with flanking gold dots (from the logo ring) ── */
.bt-eyebrow {
  display: inline-flex; align-items: center; gap: 14px;
  font-family: var(--bt-eyebrow-font); font-weight: 600; font-size: 0.78rem;
  letter-spacing: 0.24em; text-transform: uppercase; color: var(--bt-gold-deep); }
.bt-dark .bt-eyebrow { color: var(--bt-gold-bright); }
.bt-eyebrow::before, .bt-eyebrow::after {
  content: ""; width: 5px; height: 5px; border-radius: 50%;
  background: currentColor; opacity: 0.85; flex: none; }

/* ── Display sizes ── */
.bt-display { font-size: clamp(2.7rem, 6vw, 4.4rem); font-weight: 600; }
.bt-h2 { font-size: clamp(2rem, 4vw, 2.9rem); }
.bt-lede { font-size: clamp(1.05rem, 1.9vw, 1.22rem); line-height: 1.7; }

/* ── Dark band ── */
.bt-dark { background: var(--bt-abyss); color: var(--bt-ondark); }
.bt-dark .bt-muted-text { color: var(--bt-ondark-muted); }
.bt-muted-text { color: var(--bt-muted); }

/* ── Buttons ── */
.bt-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 9px;
  font-family: var(--bt-body-font); font-weight: 700; font-size: 0.95rem;
  letter-spacing: 0.04em; padding: 14px 28px; border-radius: var(--bt-radius);
  background: linear-gradient(160deg, var(--bt-gold-bright), var(--bt-gold) 55%, var(--bt-gold-deep));
  color: #171204; border: 1px solid var(--bt-gold-deep); cursor: pointer;
  transition: filter .15s, transform .08s, box-shadow .15s; }
.bt-btn:hover { filter: brightness(1.07); color: #171204; box-shadow: 0 6px 22px rgba(196,160,60,.35); }
.bt-btn:active { transform: translateY(1px); }
.bt-btn-outline {
  background: none; color: var(--bt-ink); border: 1px solid var(--bt-ink);
  box-shadow: none; }
.bt-btn-outline:hover { background: var(--bt-ink); color: var(--bt-ivory); filter: none; box-shadow: none; }
.bt-dark .bt-btn-outline, .bt-btn-ghost {
  background: none; color: var(--bt-ondark); border: 1px solid var(--bt-line-dark); box-shadow: none; }
.bt-dark .bt-btn-outline:hover, .bt-btn-ghost:hover {
  background: rgba(237,195,104,.1); color: var(--bt-gold-bright);
  border-color: var(--bt-gold); filter: none; box-shadow: none; }
.bt-root .bt-active { color: var(--bt-gold-bright); }

/* ── Cards ── */
.bt-card {
  background: var(--bt-paper); border: 1px solid var(--bt-line);
  border-radius: var(--bt-radius-lg); transition: transform .18s, box-shadow .18s, border-color .18s; }
a.bt-card:hover, .bt-card-hover:hover {
  transform: translateY(-3px); border-color: var(--bt-gold);
  box-shadow: 0 14px 34px rgba(34,29,20,.1); }

/* ── Gold hairline rule ── */
.bt-rule { border: 0; height: 1px; margin: 0;
  background: linear-gradient(90deg, transparent, var(--bt-gold) 20%, var(--bt-gold) 80%, transparent); opacity: .5; }

/* ── Section rhythm ── */
.bt-section { max-width: var(--bt-maxw); margin: 0 auto; padding: clamp(64px, 9vw, 104px) 22px; }
.bt-section-tight { max-width: var(--bt-maxw); margin: 0 auto; padding: clamp(44px, 6vw, 64px) 22px; }

/* ── Entrance reveal (hero load sequence) ── */
@keyframes btRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
.bt-rise { animation: btRise .8s cubic-bezier(.2,.7,.2,1) both; }
.bt-rise-2 { animation: btRise .8s cubic-bezier(.2,.7,.2,1) .15s both; }
.bt-rise-3 { animation: btRise .8s cubic-bezier(.2,.7,.2,1) .3s both; }
@media (prefers-reduced-motion: reduce) {
  .bt-rise, .bt-rise-2, .bt-rise-3 { animation: none; }
  .bt-root * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
`;

/**
 * Injects the BT brand tokens + base styles. Render ONCE inside the `.bt-root` wrapper.
 */
export const BtTheme: React.FC = () => (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
    <style dangerouslySetInnerHTML={{ __html: BT_CSS }} />
  </>
);
