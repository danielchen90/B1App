"use client";

import React from "react";
import Link from "next/link";
import { MY_CSS } from "./MyUi";

/** Shown on any My Church page when nobody is signed in. */
export const SignedOutCard: React.FC<{ returnUrl?: string }> = ({ returnUrl = "/my" }) => (
  <div style={{ maxWidth: 1400, margin: "0 auto", padding: "48px 24px 80px" }}>
    <style dangerouslySetInnerHTML={{ __html: MY_CSS }} />
    <div className="my-card" style={{ maxWidth: 580, display: "grid", gap: 14 }}>
      <div className="bt-eyebrow">My Church</div>
      <h1 className="bt-h2">Your church, in one place</h1>
      <p>Sign in with your Mary Banks ID to see your worship center&rsquo;s news and events, your classes and serving schedule, your giving and partnership, and everything you&rsquo;ve sent.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <a className="bt-btn" href={"/api/auth/mbid/start?returnUrl=" + encodeURIComponent(returnUrl)}>Sign in</a>
        <Link className="bt-btn bt-btn-outline" href="/">Back home</Link>
      </div>
    </div>
  </div>
);
