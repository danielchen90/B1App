// Bible Teachers public brand theme (Phase 20, Plan 04).
//
// HARDCODED black/white/gold CSS-var theme — the DISTINCT public brand for the
// Bible Teachers site (SITE-01). It deliberately does NOT read globalStyles /
// per-tenant palette: generalized, data-driven per-tenant theming is DEFERRED to
// Phase 21. This component is the single seam where that hardcoding lives — swap
// the values here (or make them data-driven) later without touching any consumer.
//
// The vars are scoped to a `.bt-root` wrapper (NOT :root) so they can never bleed
// into the Huro admin navy/gold theme, even if both render in the same document.
// churchId-scoping stays underneath in the data layer; only the LOOK is hardcoded.
//
// Brand rules (LOCKED): light theme, predominantly white surfaces, black ink,
// GOLD as the single accent (buttons / highlights / active states) — visibly
// different from the Huro admin navy/gold.

import React from "react";

// The bold display + clean body pairing. Sora (bold, geometric) for headings,
// Inter for body — a modern-megachurch feel, distinct from the admin type.
const HEADING_FONT = "Sora";
const BODY_FONT = "Inter";

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=" +
  HEADING_FONT + ":wght@600;700;800" +
  "&family=" + BODY_FONT + ":wght@400;500;600;700" +
  "&display=swap";

// Hardcoded token set. `--bt-*` names are intentionally namespaced so no admin
// token is ever shadowed.
const BT_VARS = [
  "--bt-bg: #ffffff;",
  "--bt-surface: #ffffff;",
  "--bt-surface-alt: #f7f7f5;", // barely-off-white section banding, still "predominantly white"
  "--bt-ink: #0a0a0a;",
  "--bt-muted: #4a4a4a;",
  "--bt-line: #e6e6e2;",
  "--bt-gold: #c9a227;",
  "--bt-gold-strong: #b8901c;", // hover/active gold
  "--bt-gold-ink: #0a0a0a;", // ink that sits ON gold (black, per brand)
  "--bt-radius: 10px;",
  "--bt-radius-lg: 18px;",
  "--bt-maxw: 1120px;",
  "--bt-heading-font: '" + HEADING_FONT + "', system-ui, sans-serif;",
  "--bt-body-font: '" + BODY_FONT + "', system-ui, sans-serif;"
].join(" ");

// Base element styling scoped under .bt-root — kept minimal (the pages/components
// carry their own layout styles), just enough to establish the b/w/gold ground,
// the type, the primary/secondary CTA look, and the gold accent/active states.
const BT_CSS =
  ".bt-root {" + BT_VARS +
  " background: var(--bt-bg); color: var(--bt-ink);" +
  " font-family: var(--bt-body-font);" +
  " -webkit-font-smoothing: antialiased; }" +
  " .bt-root h1, .bt-root h2, .bt-root h3, .bt-root h4 {" +
  " font-family: var(--bt-heading-font); color: var(--bt-ink);" +
  " letter-spacing: -0.02em; line-height: 1.05; margin: 0; }" +
  " .bt-root a { color: inherit; text-decoration: none; }" +
  " .bt-root a:hover { color: var(--bt-gold-strong); }" +
  // Primary CTA: solid gold, black ink.
  " .bt-btn {" +
  " display: inline-flex; align-items: center; justify-content: center;" +
  " gap: 8px; font-family: var(--bt-heading-font); font-weight: 700;" +
  " font-size: 1rem; padding: 14px 26px; border-radius: var(--bt-radius);" +
  " background: var(--bt-gold); color: var(--bt-gold-ink);" +
  " border: 2px solid var(--bt-gold); cursor: pointer;" +
  " transition: background .15s, border-color .15s, transform .05s; }" +
  " .bt-btn:hover { background: var(--bt-gold-strong); border-color: var(--bt-gold-strong); color: var(--bt-gold-ink); }" +
  " .bt-btn:active { transform: translateY(1px); }" +
  // Secondary CTA: black outline on white.
  " .bt-btn-outline {" +
  " background: transparent; color: var(--bt-ink); border: 2px solid var(--bt-ink); }" +
  " .bt-btn-outline:hover { background: var(--bt-ink); color: #fff; border-color: var(--bt-ink); }" +
  // Active nav state uses the gold accent (underline), never a fill.
  " .bt-root .bt-active { color: var(--bt-ink); border-bottom: 2px solid var(--bt-gold); }";

/**
 * Injects the hardcoded BT brand tokens + base styles. Render ONCE, inside the
 * `.bt-root` wrapper (see the BT landing page). Ships the display/body fonts in
 * the initial HTML (no FOUT/CLS), mirroring Theme.tsx's hoisted-font mechanism.
 */
export const BtTheme: React.FC = () => (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
    <style dangerouslySetInnerHTML={{ __html: BT_CSS }} />
  </>
);
