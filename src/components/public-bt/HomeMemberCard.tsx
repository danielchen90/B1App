"use client";

// The home page's door into My Church, beside "Your worship center" on the hero dock.
// Signed out it says what My Church holds and signs in with Mary Banks ID; signed in it
// welcomes the member back and opens My Church. Renders nothing until member accounts
// are switched on (BT_MEMBER_SIGNIN=1).

import React from "react";
import Link from "next/link";
import { useMemberBadge } from "./BtAccountButton";
import { IconArrowRight, IconCalendar, IconGift, IconUsers, IconUser } from "./BtIcons";

const CSS = `
.bthm { position: relative; overflow: hidden; width: 100%; display: grid; gap: 12px; align-content: start; padding: 24px 26px;
  border-radius: var(--bt-radius-lg); color: rgba(255,255,255,.86);
  background: radial-gradient(28rem 16rem at 110% -10%, rgba(240,191,76,.28), transparent 70%), linear-gradient(160deg, #26211A, #16120D);
  box-shadow: 0 2px 4px rgba(24,24,32,.08), 0 30px 60px -28px rgba(24,24,32,.6); }
.bthm .bt-eyebrow { color: var(--bt-gold-bright); }
.bthm h2 { color: #fff; font-size: 1.7rem; line-height: 1.1; }
.bthm p { font-size: .95rem; line-height: 1.55; }
.bthm ul { list-style: none; margin: 2px 0 0; padding: 0; display: grid; gap: 7px; font-size: .92rem; }
.bthm li { display: flex; align-items: center; gap: 9px; }
.bthm li svg { color: var(--bt-gold-bright); flex: none; }
.bthm-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 6px; }
.bt-root .bthm-link { color: rgba(255,255,255,.8); font-weight: 600; font-size: .92rem; display: inline-flex; align-items: center; gap: 6px; }
.bt-root .bthm-link:hover { color: #fff; }
.bthm-avatar { width: 46px; height: 46px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
  background: var(--bt-gold-bright); color: #1B1408; font-family: var(--bt-display-font); font-size: 1.5rem; font-weight: 700; }
`;

export const HomeMemberCard: React.FC = () => {
  const { enabled, name } = useMemberBadge();
  if (!enabled) return null;

  if (name) {
    return (
      <div className="bthm">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="bthm-avatar" aria-hidden>{name.trim().charAt(0).toUpperCase()}</span>
          <div>
            <div className="bt-eyebrow">My Church</div>
            <h2>Welcome back, {name}</h2>
          </div>
        </div>
        <p>Your center&rsquo;s news and events, your classes and serving, and your giving are waiting for you.</p>
        <div className="bthm-actions">
          <Link className="bt-btn" href="/my">Open My Church <IconArrowRight size={16} /></Link>
          <Link className="bthm-link" href="/my/giving"><IconGift size={16} /> My giving</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bthm">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bt-eyebrow">My Church</div>
      <h2>Your church home, in one place</h2>
      <ul>
        <li><IconCalendar size={17} /> Your center&rsquo;s news, events and gatherings</li>
        <li><IconUsers size={17} /> Your classes, groups and serving schedule</li>
        <li><IconGift size={17} /> Your giving and partnership</li>
      </ul>
      <div className="bthm-actions">
        <a className="bt-btn" href={"/api/auth/mbid/start?returnUrl=" + encodeURIComponent("/my")}><IconUser size={17} /> Sign in to My Church</a>
      </div>
      <p style={{ fontSize: ".85rem", color: "rgba(255,255,255,.6)" }}>One Mary Banks ID for the Faith Library, the Training Center and your church.</p>
    </div>
  );
};
