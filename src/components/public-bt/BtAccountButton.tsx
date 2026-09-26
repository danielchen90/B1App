"use client";

// Header account action. Signed out: "Sign in" (Mary Banks ID). Signed in: the
// member's initial, linking to My Church. Hidden entirely until member accounts are
// switched on with BT_MEMBER_SIGNIN=1 (see lib/memberSignIn.ts), so the public site never shows a
// sign-in that goes nowhere.
//
// The signed-in state is read from the small `bt_member` display cookie the sign-in
// callback sets beside the real session (first name only, not a credential).

import React from "react";
import Link from "next/link";
import { memberSignInEnabledInBrowser } from "@/lib/memberSignIn";

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

export const BtAccountButton: React.FC = () => {
  const [enabled, setEnabled] = React.useState(false);
  const [name, setName] = React.useState<string | null>(null);

  React.useEffect(() => {
    const on = memberSignInEnabledInBrowser();
    setEnabled(on);
    if (on) setName(readMemberName());
  }, []);

  if (!enabled) return null;

  if (name) {
    return (
      <Link
        href="/my"
        aria-label={"My Church, signed in as " + name}
        title="My Church"
        style={{
          width: 38, height: 38, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "var(--bt-ink)", color: "#fff", fontWeight: 600, fontSize: "0.95rem"
        }}
      >
        {name.trim().charAt(0).toUpperCase()}
      </Link>
    );
  }

  return (
    <Link href="/login" className="bt-btn bt-btn-sm bt-btn-outline" style={{ whiteSpace: "nowrap" }}>
      Sign in
    </Link>
  );
};
