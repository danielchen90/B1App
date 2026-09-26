"use client";

// Header account action, labelled "My Church" so members can always find their church
// home. Signed out it goes to /my, which explains My Church and offers Mary Banks ID
// sign-in; signed in it shows the member's initial beside the label. Hidden entirely
// until member accounts are switched on with BT_MEMBER_SIGNIN=1 (see
// lib/memberSignIn.ts), so the public site never shows a link that goes nowhere.
//
// The signed-in state is read from the small `bt_member` display cookie the sign-in
// callback sets beside the real session (first name only, not a credential).

import React from "react";
import Link from "next/link";
import { memberSignInEnabledInBrowser } from "@/lib/memberSignIn";
import { IconUser } from "./BtIcons";

const readMemberName = (): string | null => {
  if (typeof document === "undefined") return null;
  const hit = document.cookie.split("; ").find((c) => c.startsWith("bt_member="));
  if (!hit) return null;
  try {
    return decodeURIComponent(hit.slice("bt_member=".length)) || null;
  } catch {
    return null;
  }
};

/** Whether member accounts are on, and the signed-in member's first name (null when signed out). */
export const useMemberBadge = (): { enabled: boolean; name: string | null } => {
  const [state, setState] = React.useState<{ enabled: boolean; name: string | null }>({ enabled: false, name: null });
  React.useEffect(() => {
    const on = memberSignInEnabledInBrowser();
    setState({ enabled: on, name: on ? readMemberName() : null });
  }, []);
  return state;
};

const CSS = `
.bt-root .bt-mychurch { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 4px 14px 4px 4px; border-radius: 999px;
  background: var(--bt-paper); color: var(--bt-ink); box-shadow: inset 0 0 0 1.5px var(--bt-line-strong); font-weight: 600; font-size: 0.9rem; white-space: nowrap; }
.bt-root .bt-mychurch:hover { box-shadow: inset 0 0 0 1.5px var(--bt-gold); background: var(--bt-gold-soft); }
.bt-mychurch-dot { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
  background: var(--bt-ink); color: #fff; font-weight: 600; font-size: 0.9rem; }
.bt-mychurch-dot.out { background: var(--bt-gold-soft); color: var(--bt-gold-deep); }
@media (max-width: 520px) { .bt-root .bt-mychurch { padding: 4px; } .bt-mychurch-label { display: none; } }
`;

export const BtAccountButton: React.FC = () => {
  const { enabled, name } = useMemberBadge();
  if (!enabled) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Link
        href="/my"
        className="bt-mychurch"
        aria-label={name ? "My Church, signed in as " + name : "My Church: sign in with your Mary Banks ID"}
        title={name ? "My Church" : "My Church: sign in"}
      >
        {name
          ? <span className="bt-mychurch-dot" aria-hidden>{name.trim().charAt(0).toUpperCase()}</span>
          : <span className="bt-mychurch-dot out" aria-hidden><IconUser size={17} /></span>}
        <span className="bt-mychurch-label">My Church</span>
      </Link>
    </>
  );
};
