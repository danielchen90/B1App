// Bible Teachers International — public brand theme.
//
// 2026-09 redesign: the church joins the Mary Banks family look shared by the Faith
// Library, the Global Training Center and the Mary Banks ID pages: a light, quiet
// page, white cards, one antique-gold accent, Cormorant Garamond for display and
// Outfit for everything else. What makes it the church is photography (each center's
// own photos, uploaded by its admin) rather than dark bands and ornament.
//
// Token NAMES are unchanged from the first design so every component restyles from
// here; only the values moved. `.bt-dark` survives as a deep-ink band (footer, the
// occasional feature band).
//
// All vars scoped to `.bt-root` (never :root) so nothing leaks into the Huro admin.

import React from "react";

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2" +
  "?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600" +
  "&family=Outfit:wght@400;500;600;700" +
  "&display=swap";

const BT_VARS = [
  // ground + surfaces (Faith Library values)
  "--bt-ivory: #F7F7F8;",
  "--bt-paper: #FFFFFF;",
  "--bt-sunk: #F1F0EC;",
  "--bt-abyss: #1B1B22;",
  "--bt-abyss-2: #26262F;",
  // ink + text
  "--bt-ink: #1B1B22;",
  "--bt-body: #45454F;",
  "--bt-muted: #6E6E7A;",
  "--bt-ondark: #F4F2EC;",
  "--bt-ondark-muted: #B9B7B0;",
  // gold
  "--bt-gold: #B8912A;",
  "--bt-gold-bright: #F0BF4C;",
  "--bt-gold-deep: #8A6A14;",
  "--bt-gold-soft: rgba(184,145,42,0.10);",
  "--bt-live: #C93F58;",
  // hairlines
  "--bt-line: rgba(24,24,32,0.09);",
  "--bt-line-strong: rgba(24,24,32,0.16);",
  "--bt-line-dark: rgba(255,255,255,0.14);",
  // geometry
  "--bt-radius: 12px;",
  "--bt-radius-lg: 20px;",
  "--bt-maxw: 1200px;",
  "--bt-shadow: 0 1px 2px rgba(24,24,32,.04), 0 18px 40px -26px rgba(24,24,32,.28);",
  // type
  "--bt-display-font: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;",
  "--bt-eyebrow-font: 'Outfit', system-ui, sans-serif;",
  "--bt-body-font: 'Outfit', system-ui, -apple-system, 'Segoe UI', sans-serif;",
  // kept for older components that still read these
  "--bt-bg: var(--bt-ivory);",
  "--bt-surface: var(--bt-paper);",
  "--bt-surface-alt: var(--bt-sunk);",
  "--bt-gold-strong: var(--bt-gold-deep);",
  "--bt-gold-ink: #1B1408;",
  "--bt-heading-font: var(--bt-display-font);"
].join(" ");

const BT_CSS = `
.bt-root { ${BT_VARS}
  background: var(--bt-ivory); color: var(--bt-body);
  font-family: var(--bt-body-font); font-size: 16.5px; line-height: 1.65;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
.bt-root *, .bt-root *::before, .bt-root *::after { box-sizing: border-box; }
body:has(.bt-root) { margin: 0; }
.bt-root h1, .bt-root h2, .bt-root h3 {
  font-family: var(--bt-display-font); font-weight: 600; color: var(--bt-ink);
  letter-spacing: 0; line-height: 1.08; margin: 0; text-wrap: balance; }
.bt-root h4, .bt-root h5 { font-family: var(--bt-body-font); font-weight: 600; color: var(--bt-ink); margin: 0; }
.bt-root a { color: inherit; text-decoration: none; }
.bt-root p { margin: 0; }
.bt-root img { max-width: 100%; }
.bt-root :focus-visible { outline: 2px solid var(--bt-gold); outline-offset: 3px; border-radius: 4px; }

/* ── Eyebrow: small letterspaced caps in gold ── */
.bt-eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--bt-eyebrow-font); font-weight: 600; font-size: 0.74rem;
  letter-spacing: 0.16em; text-transform: uppercase; color: var(--bt-gold-deep); }
.bt-dark .bt-eyebrow { color: var(--bt-gold-bright); }

/* ── Display sizes ── */
.bt-display { font-size: clamp(2.6rem, 5.6vw, 4.2rem); font-weight: 600; }
.bt-h2 { font-size: clamp(1.9rem, 3.6vw, 2.7rem); }
.bt-h3 { font-size: clamp(1.35rem, 2.2vw, 1.6rem); }
.bt-lede { font-size: clamp(1.04rem, 1.7vw, 1.18rem); line-height: 1.65; color: var(--bt-body); }

/* ── Dark band (deep ink) ── */
.bt-dark { background: var(--bt-abyss); color: var(--bt-ondark); }
.bt-dark h1, .bt-dark h2, .bt-dark h3, .bt-dark h4 { color: var(--bt-ondark); }
.bt-dark .bt-muted-text { color: var(--bt-ondark-muted); }
.bt-muted-text { color: var(--bt-muted); }

/* ── Buttons: flat gold primary, ink outline secondary ── */
.bt-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 9px;
  font-family: var(--bt-body-font); font-weight: 600; font-size: 0.97rem;
  padding: 13px 24px; border-radius: var(--bt-radius); min-height: 48px;
  background: var(--bt-gold); color: #1B1408; border: 0; cursor: pointer;
  box-shadow: 0 8px 18px -12px rgba(138,106,20,.9);
  transition: background-color .15s, transform .08s, box-shadow .15s, color .15s; }
.bt-btn:hover { background: var(--bt-gold-deep); color: #fff; }
.bt-btn:active { transform: translateY(1px); }
.bt-btn[disabled] { opacity: .6; cursor: default; }
.bt-btn-outline, .bt-btn-ghost {
  background: var(--bt-paper); color: var(--bt-ink); box-shadow: inset 0 0 0 1.5px var(--bt-line-strong); }
.bt-btn-outline:hover, .bt-btn-ghost:hover { background: var(--bt-gold-soft); color: var(--bt-ink); box-shadow: inset 0 0 0 1.5px var(--bt-gold); }
.bt-dark .bt-btn-outline, .bt-dark .bt-btn-ghost {
  background: transparent; color: var(--bt-ondark); box-shadow: inset 0 0 0 1.5px var(--bt-line-dark); }
.bt-dark .bt-btn-outline:hover, .bt-dark .bt-btn-ghost:hover { background: rgba(240,191,76,.12); color: var(--bt-gold-bright); box-shadow: inset 0 0 0 1.5px var(--bt-gold); }
.bt-btn-sm { min-height: 40px; padding: 8px 16px; font-size: 0.9rem; }
/* .bt-root a { color: inherit } outranks the single-class button colours on links. */
.bt-root .bt-btn { color: #1B1408; }
.bt-root .bt-btn:hover { color: #fff; }
.bt-root .bt-btn-outline, .bt-root .bt-btn-ghost,
.bt-root .bt-btn-outline:hover, .bt-root .bt-btn-ghost:hover { color: var(--bt-ink); }
.bt-root .bt-dark .bt-btn-outline, .bt-root .bt-dark .bt-btn-ghost { color: var(--bt-ondark); }
.bt-root .bt-dark .bt-btn-outline:hover, .bt-root .bt-dark .bt-btn-ghost:hover { color: var(--bt-gold-bright); }
.bt-root .bt-active { color: var(--bt-ink); }
.bt-link { display: inline-flex; align-items: center; gap: 7px; color: var(--bt-gold-deep); font-weight: 600; }
.bt-link:hover { color: var(--bt-ink); }

/* ── Cards ── */
.bt-card {
  background: var(--bt-paper); border: 1px solid var(--bt-line);
  border-radius: var(--bt-radius-lg); transition: transform .18s, box-shadow .18s, border-color .18s; }
a.bt-card:hover, .bt-card-hover:hover {
  transform: translateY(-2px); border-color: rgba(184,145,42,.45); box-shadow: var(--bt-shadow); }

/* ── Chips ── */
.bt-chip { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 999px;
  background: var(--bt-paper); box-shadow: inset 0 0 0 1px var(--bt-line-strong); color: var(--bt-ink);
  font-family: var(--bt-body-font); font-weight: 500; font-size: 0.93rem; border: 0; cursor: pointer;
  transition: box-shadow .15s, background-color .15s; }
a.bt-chip:hover, button.bt-chip:hover { box-shadow: inset 0 0 0 1.5px var(--bt-gold); background: var(--bt-gold-soft); }
.bt-dark .bt-chip { background: transparent; box-shadow: inset 0 0 0 1px var(--bt-line-dark); color: var(--bt-ondark); }

/* ── Gold hairline rule ── */
.bt-rule { border: 0; height: 1px; margin: 0; background: var(--bt-line); }

/* ── Section rhythm ── */
.bt-section { max-width: var(--bt-maxw); margin: 0 auto; padding: clamp(56px, 8vw, 96px) 20px; }
.bt-section-tight { max-width: var(--bt-maxw); margin: 0 auto; padding: clamp(36px, 5vw, 56px) 20px; }
.bt-band { background: var(--bt-sunk); border-top: 1px solid var(--bt-line); border-bottom: 1px solid var(--bt-line); }
.bt-section-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 24px; margin-bottom: 26px; }
.bt-section-head h2 { margin-top: 8px; }

/* ── Forms (shared by the public forms) ── */
.bt-field { width: 100%; padding: 12px 14px; font-size: 16px; font-family: inherit; color: var(--bt-ink);
  background: var(--bt-paper); border: 1px solid var(--bt-line-strong); border-radius: 10px; }
.bt-field:focus { outline: none; border-color: var(--bt-gold); box-shadow: 0 0 0 4px var(--bt-gold-soft); }

/* ── Live dot ── */
@keyframes btPulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
.bt-live-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: var(--bt-live); animation: btPulse 1.6s ease-in-out infinite; }

/* ── Entrance reveal ── */
@keyframes btRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.bt-rise { animation: btRise .7s cubic-bezier(.2,.7,.2,1) both; }
.bt-rise-2 { animation: btRise .7s cubic-bezier(.2,.7,.2,1) .1s both; }
.bt-rise-3 { animation: btRise .7s cubic-bezier(.2,.7,.2,1) .2s both; }
@media (prefers-reduced-motion: reduce) {
  .bt-rise, .bt-rise-2, .bt-rise-3, .bt-live-dot { animation: none; }
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
