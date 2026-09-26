// Shown when a Mary Banks ID sign-in comes back without a session. Says what
// happened in plain words and offers the one thing to do next.

import React from "react";
import Link from "next/link";
import { BtTheme } from "./BtTheme";
import { BtBrand } from "./BtBrand";

const COPY: Record<string, { title: string; body: string }> = {
  cancelled: { title: "Sign-in was cancelled", body: "No problem. You can sign in any time with Google or your email." },
  session_lost: { title: "That sign-in took too long", body: "For your safety, sign-in links expire after 20 minutes. Please start again." },
  email_unverified: { title: "Please confirm your email first", body: "Mary Banks ID sent you a confirmation email. Open it, then sign in again. Signing in with Google skips this step." },
  not_configured: { title: "Sign-in isn't switched on yet", body: "Member sign-in for the worship centers is being set up. Please try again soon." }
};

export const MbidError: React.FC<{ reason: string }> = ({ reason }) => {
  const c = COPY[reason] || { title: "We couldn't sign you in", body: "Something went wrong on our side. Please try again in a moment." };
  return (
    <div className="bt-root" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px 16px" }}>
      <BtTheme />
      <div className="bt-card" style={{ maxWidth: 460, width: "100%", padding: "32px 28px", display: "grid", gap: 14, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}><BtBrand size="sm" /></div>
        <h1 className="bt-h3" style={{ marginTop: 8 }}>{c.title}</h1>
        <p>{c.body}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
          <a className="bt-btn" href="/api/auth/mbid/start">Sign in again</a>
          <Link className="bt-btn bt-btn-outline" href="/">Home</Link>
        </div>
      </div>
    </div>
  );
};
