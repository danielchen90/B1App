"use client";

import React from "react";
import Link from "next/link";
import { MY_CSS } from "./MyUi";
import { IconCalendar, IconUsers, IconGift, IconHands, IconAward, IconUser } from "../BtIcons";

const CSS = `
.myso { max-width: 1200px; margin: 0 auto; padding: 40px 20px 80px; }
.myso-panel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); border-radius: 24px; overflow: hidden;
  background: var(--bt-paper); border: 1px solid var(--bt-line); box-shadow: 0 30px 60px -32px rgba(24,24,32,.45); }
@media (max-width: 860px) { .myso-panel { grid-template-columns: 1fr; } }
.myso-photo { position: relative; min-height: 380px; background: #16120D url(/bt/hero-choir.jpg) 60% 35% / cover no-repeat; display: flex; align-items: flex-end; }
.myso-photo::before { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20,14,8,.05) 30%, rgba(20,14,8,.85)); }
.myso-photo div { position: relative; padding: 28px; color: #fff; }
.myso-photo p { font-family: var(--bt-display-font); font-style: italic; font-size: 1.3rem; line-height: 1.35; }
.myso-photo cite { display: block; margin-top: 6px; font-style: normal; font-size: 11px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--bt-gold-bright); }
.myso-body { padding: clamp(28px, 4vw, 48px); display: grid; gap: 16px; align-content: center; }
.myso-list { list-style: none; margin: 4px 0; padding: 0; display: grid; gap: 12px; }
.myso-list li { display: flex; gap: 12px; align-items: flex-start; }
.myso-list li > span:first-child { flex: none; width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--bt-gold-soft); color: var(--bt-gold-deep); }
.myso-list b { display: block; color: var(--bt-ink); font-weight: 600; }
.myso-list small { display: block; font-size: .9rem; color: var(--bt-muted); }
`;

const ITEMS = [
  { icon: IconCalendar, title: "Your worship center", sub: "Its news, events and the next gathering" },
  { icon: IconUsers, title: "Classes and serving", sub: "Your groups, discipleship classes and serving schedule" },
  { icon: IconGift, title: "Giving and partnership", sub: "What you've given and your partnership" },
  { icon: IconHands, title: "Prayer and requests", sub: "Everything you've sent, and where it stands" },
  { icon: IconAward, title: "Ministers", sub: "Your ordination and license details" }
];

/** Shown on any My Church page when nobody is signed in. */
export const SignedOutCard: React.FC<{ returnUrl?: string }> = ({ returnUrl = "/my" }) => (
  <div className="myso">
    <style dangerouslySetInnerHTML={{ __html: MY_CSS + CSS }} />
    <div className="myso-panel">
      <div className="myso-photo">
        <div>
          <p>&ldquo;I was glad when they said unto me, Let us go into the house of the LORD.&rdquo;</p>
          <cite>Psalm 122:1</cite>
        </div>
      </div>
      <div className="myso-body">
        <div className="bt-eyebrow">My Church</div>
        <h1 className="bt-h2">Your church home, in one place</h1>
        <p>Sign in with your Mary Banks ID, the same one you use for the Faith Library and the Global Training Center.</p>
        <ul className="myso-list">
          {ITEMS.map(({ icon: Icon, title, sub }) => (
            <li key={title}><span><Icon size={18} /></span><span><b>{title}</b><small>{sub}</small></span></li>
          ))}
        </ul>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a className="bt-btn" href={"/api/auth/mbid/start?returnUrl=" + encodeURIComponent(returnUrl)}><IconUser size={17} /> Sign in to My Church</a>
          <Link className="bt-btn bt-btn-outline" href="/">Back home</Link>
        </div>
      </div>
    </div>
  </div>
);
