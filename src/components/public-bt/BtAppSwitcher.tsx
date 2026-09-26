"use client";

// The nine dots: a way across the Mary Banks Ministries sites, like the app launcher
// in Google's apps. Each site is a card with a picture of what it is, what it is for
// and what is inside; the one you are on is marked. The same switcher (and the same
// art and wording) lives in the Faith Library, the Global Training Center and the
// Bible Teacher app (components/ecosystem/app-cards.tsx there); keep them in step.

import React from "react";
import { IconDots, IconUser } from "./BtIcons";

type AppId = "faith-library" | "gtc" | "bible-teacher" | "worship-centers" | "partners";

const APPS: { id: AppId; name: string; url: string; body: string; tags: string[] }[] = [
  {
    id: "faith-library",
    name: "Faith Library",
    url: "https://new.mbfaithlibrary.com",
    body: "Every book by Dr. Mary Banks, free to read, download and listen to.",
    tags: ["Books", "Audiobooks", "Study Center"]
  },
  {
    id: "gtc",
    name: "Global Training Center",
    url: "https://mbmonline.global",
    body: "Free courses with video lessons, Growth Paths and certificates.",
    tags: ["Courses", "Growth Paths", "Certificates"]
  },
  {
    id: "bible-teacher",
    name: "Bible Teacher",
    url: "https://app.thebibleteacher.com",
    body: "Study the Scriptures with teaching, topics and your own workspaces.",
    tags: ["Bible", "Topics", "Workspaces"]
  },
  {
    id: "worship-centers",
    name: "Worship Centers",
    url: "/",
    body: "Bible Teachers International: find a worship center near you, join the Online Church, or watch the latest message.",
    tags: ["Locations", "Online Church", "Sermons"]
  },
  {
    id: "partners",
    name: "Partners",
    url: "https://partners.mbmonline.global",
    body: "Give monthly or once to keep it all free and carry it to the nations.",
    tags: ["Give", "Monthly or once", "Your giving"]
  }
];

const ID_ACCOUNT_URL = "https://id.mbmonline.global/realms/marybanks/account";

// Colours are written out (not theme tokens) so every site draws the same art.
const ART: Record<AppId, { bg: string; draw: React.ReactNode }> = {
  "faith-library": {
    bg: "#F5E9C8",
    draw: (
      <>
        <rect x="12" y="20" width="10" height="34" rx="1.5" fill="#23222B" />
        <rect x="14" y="25" width="6" height="1.5" rx=".75" fill="#F0BF4C" />
        <rect x="23.5" y="16" width="11" height="38" rx="1.5" fill="#B8912A" />
        <rect x="25.5" y="21" width="7" height="1.5" rx=".75" fill="#FFF7E2" />
        <rect x="25.5" y="24.5" width="5" height="1.2" rx=".6" fill="#FFF7E2" opacity=".7" />
        <rect x="36" y="22" width="9" height="32" rx="1.5" fill="#C93F58" />
        <rect x="47" y="24" width="10" height="31" rx="1.5" fill="#6E5B3A" transform="rotate(14 52 54)" />
        <rect x="8" y="54" width="54" height="3" rx="1.5" fill="#9C7A1F" />
        <path d="M44 14a7 7 0 0 1 14 0" fill="none" stroke="#23222B" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="42.5" y="13" width="3.6" height="6" rx="1.6" fill="#23222B" />
        <rect x="55.9" y="13" width="3.6" height="6" rx="1.6" fill="#23222B" />
      </>
    )
  },
  gtc: {
    bg: "#23222B",
    draw: (
      <>
        <rect x="9" y="15" width="46" height="29" rx="4" fill="#3A3844" />
        <circle cx="32" cy="29.5" r="7.5" fill="#F0BF4C" />
        <path d="M30 25.8v7.4l6-3.7z" fill="#23222B" />
        <rect x="9" y="49" width="46" height="3" rx="1.5" fill="#4A4855" />
        <rect x="9" y="49" width="28" height="3" rx="1.5" fill="#F0BF4C" />
        <circle cx="56" cy="50" r="6.5" fill="#B8912A" stroke="#23222B" strokeWidth="2" />
        <path d="M52.5 55l-2 7 3.8-2 2 3 1.2-7M59.5 55l2 7-3.8-2" fill="#B8912A" />
      </>
    )
  },
  "bible-teacher": {
    bg: "#DCEFE6",
    draw: (
      <>
        <path d="M8 22c8-3 16-3 24 1v30c-8-4-16-4-24-1z" fill="#FFFFFF" />
        <path d="M56 22c-8-3-16-3-24 1v30c8-4 16-4 24-1z" fill="#F7FBF9" />
        <path d="M32 23v30" stroke="#1F6B47" strokeWidth="1.2" opacity=".35" />
        {[28, 32, 36, 40, 44].map((y) => (
          <g key={y}>
            <rect x="12" y={y} width={y === 44 ? 10 : 16} height="1.6" rx=".8" fill="#1F6B47" opacity=".45" />
            <rect x="36" y={y} width={y === 36 ? 9 : 16} height="1.6" rx=".8" fill="#1F6B47" opacity=".45" />
          </g>
        ))}
        <rect x="12" y="32" width="16" height="1.6" rx=".8" fill="#F0BF4C" />
        <path d="M44 22v14l3-2.4 3 2.4V21" fill="#C93F58" />
        <path d="M6 53c9-3 17-3 26 1 9-4 17-4 26-1" fill="none" stroke="#1F6B47" strokeWidth="2" strokeLinecap="round" />
      </>
    )
  },
  "worship-centers": {
    bg: "#FAF6EC",
    draw: (
      <>
        <path d="M22 9v9M19 12.5h6" stroke="#C4A03C" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 16l-8 9h16z" fill="#221D14" />
        <path d="M8 34l14-13 14 13z" fill="#221D14" />
        <rect x="11" y="33" width="22" height="21" fill="#221D14" />
        <path d="M18.5 54V45a3.5 3.5 0 0 1 7 0v9z" fill="#EDC368" />
        <circle cx="22" cy="38" r="2.6" fill="#EDC368" />
        <rect x="6" y="54" width="52" height="2.6" rx="1.3" fill="#8F701F" />
        <path d="M48 47s-8-8.2-8-14a8 8 0 0 1 16 0c0 5.8-8 14-8 14z" fill="#C4A03C" />
        <circle cx="48" cy="33" r="3" fill="#FAF6EC" />
      </>
    )
  },
  partners: {
    bg: "#F8DDE3",
    draw: (
      <>
        <circle cx="32" cy="34" r="20" fill="none" stroke="#C93F58" strokeOpacity=".3" strokeWidth="1.6" />
        <ellipse cx="32" cy="34" rx="9" ry="20" fill="none" stroke="#C93F58" strokeOpacity=".3" strokeWidth="1.6" />
        <path d="M12 34h40M15 24h34M15 44h34" stroke="#C93F58" strokeOpacity=".3" strokeWidth="1.6" />
        <path d="M32 47s-12.5-7.3-12.5-15.4c0-4 3-6.9 6.6-6.9 2.5 0 4.6 1.4 5.9 3.5 1.3-2.1 3.4-3.5 5.9-3.5 3.6 0 6.6 2.9 6.6 6.9C44.5 39.7 32 47 32 47z" fill="#C93F58" />
      </>
    )
  }
};

const CSS = `
.bt-sw { position: relative; }
.bt-sw-btn { width: 40px; height: 40px; border-radius: 50%; border: 0; background: transparent; color: var(--bt-muted);
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.bt-sw-btn:hover, .bt-sw-btn[aria-expanded="true"] { background: var(--bt-sunk); color: var(--bt-ink); }
.bt-sw-panel { position: absolute; right: 0; top: calc(100% + 8px); width: 420px; max-height: calc(100dvh - 90px); overflow-y: auto;
  background: #fff; border-radius: 24px; padding: 8px; box-shadow: 0 24px 60px -20px rgba(24,24,32,.35), 0 0 0 1px rgba(24,24,32,.08); z-index: 95; }
@media (max-width: 520px) { .bt-sw-panel { position: fixed; left: 12px; right: 12px; top: 70px; width: auto; } }
.bt-sw-eyebrow { padding: 6px 12px 4px; font-size: 11px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: var(--bt-gold-deep); }
.bt-sw-card { display: flex; gap: 14px; align-items: flex-start; padding: 12px; border-radius: 16px; color: var(--bt-ink); }
.bt-sw-card:hover, .bt-sw-card[aria-current="page"] { background: #F7F7F8; }
.bt-sw-name { font-family: var(--bt-display-font); font-size: 18px; font-weight: 600; line-height: 1.2; }
.bt-sw-here { margin-left: 8px; font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; background: #1B1B22; color: #fff; border-radius: 999px; padding: 2px 8px; vertical-align: 2px; }
.bt-sw-body { display: block; margin-top: 2px; font-size: 13px; line-height: 1.4; color: var(--bt-body); }
.bt-sw-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.bt-sw-tags span { font-size: 11px; font-weight: 500; color: var(--bt-muted); background: #fff; border-radius: 999px; padding: 2px 8px; box-shadow: inset 0 0 0 1px rgba(24,24,32,.08); }
.bt-sw-id { display: flex; gap: 12px; align-items: center; margin-top: 6px; padding: 12px; border-top: 1px solid var(--bt-line); color: var(--bt-ink); border-radius: 0 0 16px 16px; }
.bt-sw-id:hover { background: #F7F7F8; }
`;

export const BtAppSwitcher: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onPointer = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onPointer); };
  }, [open]);

  return (
    <div ref={rootRef} className="bt-sw">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <button type="button" className="bt-sw-btn" aria-expanded={open} aria-haspopup="dialog" aria-label="Mary Banks sites" title="Mary Banks sites" onClick={() => setOpen((o) => !o)}>
        <IconDots size={20} />
      </button>
      {open && (
        <div className="bt-sw-panel" role="dialog" aria-label="Mary Banks sites">
          <div className="bt-sw-eyebrow">Mary Banks Ministries</div>
          {APPS.map((app) => {
            const here = app.id === "worship-centers";
            const art = ART[app.id];
            return (
              <a key={app.id} href={app.url} className="bt-sw-card" aria-current={here ? "page" : undefined} onClick={() => setOpen(false)}>
                <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden style={{ flex: "none", borderRadius: 16 }}>
                  <rect width="64" height="64" rx="14" fill={art.bg} />
                  {art.draw}
                </svg>
                <span style={{ minWidth: 0 }}>
                  <span className="bt-sw-name">{app.name}</span>
                  {here && <span className="bt-sw-here">You are here</span>}
                  <span className="bt-sw-body">{app.body}</span>
                  <span className="bt-sw-tags">{app.tags.map((t) => <span key={t}>{t}</span>)}</span>
                </span>
              </a>
            );
          })}
          <a className="bt-sw-id" href={ID_ACCOUNT_URL}>
            <span style={{ color: "var(--bt-gold)", display: "inline-flex" }}><IconUser size={20} /></span>
            <span>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>Your Mary Banks ID</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--bt-muted)" }}>One sign-in for every Mary Banks site.</span>
            </span>
          </a>
        </div>
      )}
    </div>
  );
};
