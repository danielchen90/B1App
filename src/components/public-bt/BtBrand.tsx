// Bible Teachers brand mark — the SINGLE logo drop-in seam (Phase 20, Plan 04).
//
// This is the ONLY place brand-asset markup lives. Right now it renders a
// typographic wordmark placeholder ("Bible Teachers"). When the real logo lands,
// swap the wordmark <span> block for a single <Image src=... /> here — no consumer
// (BtHeader, footer, campus pages) changes.

import React from "react";

interface Props {
  /** Slightly smaller mark for the sticky header vs. the hero. */
  size?: "sm" | "lg";
}

/**
 * Typographic wordmark placeholder. LOGO SWAP SEAM: replace the inner block with
 * `<Image src="/bt-logo.svg" alt="Bible Teachers" width={...} height={...} />`
 * (next/image) once the user provides the asset. Keep the alt text + link wrapper
 * in the consumer, not here.
 */
export const BtBrand: React.FC<Props> = ({ size = "lg" }) => {
  const fontSize = size === "sm" ? "1.15rem" : "1.6rem";
  return (
    <span
      aria-label="Bible Teachers"
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 8,
        fontFamily: "var(--bt-heading-font)",
        fontWeight: 800,
        fontSize,
        letterSpacing: "-0.03em",
        color: "var(--bt-ink)",
        lineHeight: 1
      }}
    >
      {/* --- LOGO SWAP SEAM (drop the real <Image> here) --- */}
      <span>Bible</span>
      <span style={{ color: "var(--bt-gold)" }}>Teachers</span>
    </span>
  );
};
