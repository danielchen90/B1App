// BT DISPLAY-ONLY Give CTA (Phase 20, Plan 05, GIV-01).
//
// A plain external anchor to content.givingUrl (the campus Stripe Payment Link — org
// default + per-campus override already RESOLVED into givingUrl by the API) that opens in
// a NEW TAB. There is NO Stripe SDK, NO @stripe import, and NO gift record is ever created
// on this site — giving is entirely handed off to the hosted Payment Link (display-only).
//
// One component, two variants so the SAME give affordance appears BOTH as the sticky
// header CTA (persisting one tap away — the BtHeader Give slot uses this URL) and as the
// on-page give section button. Give is CORE info: it ALWAYS shows. When givingUrl is
// absent the section variant still shows a gentle "coming soon" so the section is never
// empty (mixed empty-state: core always visible).

import React from "react";

interface Props {
  givingUrl?: string | null;
  variant?: "section" | "sticky";
}

export const GiveButton: React.FC<Props> = ({ givingUrl, variant = "section" }) => {
  if (!givingUrl) {
    // Core-always-show: no link yet → a non-link placeholder, never a hidden section.
    return variant === "section" ? (
      <span style={{ color: "var(--bt-muted)" }}>Online giving is coming soon.</span>
    ) : null;
  }

  const style: React.CSSProperties =
    variant === "sticky" ? { padding: "10px 20px", fontSize: "0.95rem" } : {};

  return (
    <a
      className="bt-btn bt-give-cta"
      href={givingUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
    >
      Give
    </a>
  );
};
