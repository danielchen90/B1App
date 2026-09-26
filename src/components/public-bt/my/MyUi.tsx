"use client";

// The church dashboard's shared pieces, drawn to the same measurements as the Faith
// Library and Global Training Center dashboards (their Tailwind classes, written out as
// CSS here because this site doesn't use Tailwind): the side rail, the cards with
// small letterspaced headings, the progress bar, the greeting.

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome, IconPin, IconPlay, IconCalendar, IconStep, IconGift, IconUser, IconSettings, IconHelp, IconLogout, IconArrowRight
} from "../BtIcons";
import { clearSessionCookies } from "./useMemberSession";

export const MY_CSS = `
.my-wrap { max-width: 1400px; margin: 0 auto; padding: 40px 24px 72px; display: flex; gap: 40px; align-items: flex-start; }
.my-main { min-width: 0; flex: 1; display: grid; gap: 24px; }
.my-main > *, .my-grid-2 > * { min-width: 0; }
.my-rail { width: 224px; flex: none; position: sticky; top: 96px; }
.my-rail ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.my-rail a { display: flex; align-items: center; gap: 12px; white-space: nowrap; border-radius: 12px; padding: 10px 14px; font-size: 14px; font-weight: 500; color: var(--bt-body); }
.my-rail a svg { color: var(--bt-muted); }
.my-rail a:hover { background: var(--bt-sunk); color: var(--bt-ink); }
.my-rail a[aria-current="page"] { background: var(--bt-gold-soft); color: var(--bt-ink); }
.my-rail a[aria-current="page"] svg { color: var(--bt-gold); }
.my-rail .my-rail-rule { border-top: 1px solid var(--bt-line); margin: 12px 0; }
.my-rail a.my-out { color: #C93F58; }
.my-rail a.my-out svg { color: #C93F58; }
.my-rail a.my-out:hover { background: rgba(201,63,88,.06); }
@media (max-width: 1023px) {
  .my-wrap { flex-direction: column; align-items: stretch; gap: 20px; padding: 24px 16px 64px; }
  .my-rail { width: auto; min-width: 0; position: static; margin: 0 -16px; }
  .my-rail ul { flex-direction: row; overflow-x: auto; padding: 0 16px 4px; gap: 8px; scrollbar-width: none; }
  .my-rail ul::-webkit-scrollbar { display: none; }
  .my-rail li { flex: none; }
  .my-rail a { border: 1px solid var(--bt-line); background: var(--bt-paper); padding: 8px 14px; }
  .my-rail a[aria-current="page"] { border-color: rgba(184,145,42,.4); }
  .my-rail .my-rail-rule { display: none; }
}
.my-card { border-radius: 16px; border: 1px solid var(--bt-line); background: var(--bt-paper); padding: 24px; }
@media (max-width: 640px) { .my-card { padding: 20px; } }
.my-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.my-head h2 { font-family: var(--bt-body-font); font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--bt-ink); line-height: 1.4; }
.my-head p { margin-top: 4px; font-size: 14px; color: var(--bt-body); }
.my-head a { display: inline-flex; align-items: center; gap: 4px; flex: none; font-size: 12px; font-weight: 500; color: var(--bt-gold-deep); }
.my-head a:hover { color: var(--bt-ink); }
.my-empty { border-radius: 12px; background: var(--bt-ivory); padding: 32px 16px; text-align: center; font-size: 14px; color: var(--bt-body); }
.my-empty a { display: inline-block; margin-top: 10px; font-weight: 500; color: var(--bt-gold-deep); }
.my-grid-2 { display: grid; gap: 24px; }
@media (min-width: 1280px) {
  .my-grid-2 { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .my-grid-hero { grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr); }
  .my-grid-wide { grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); }
}
.my-serif { font-family: var(--bt-display-font); }
.my-bar { height: 6px; width: 100%; overflow: hidden; border-radius: 999px; background: var(--bt-sunk); }
.my-bar > div { height: 100%; border-radius: 999px; background: var(--bt-gold); }
.bt-root .my-btn-dark { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 10px; background: var(--bt-ink); color: #fff; padding: 10px 20px; font-size: 14px; font-weight: 500; white-space: nowrap; border: 0; cursor: pointer; font-family: inherit; }
.bt-root .my-btn-dark:hover { background: var(--bt-gold); color: #1B1408; }
.bt-root .my-btn-line { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 10px; border: 1px solid var(--bt-line-strong); background: transparent; padding: 8px 14px; font-size: 13px; font-weight: 500; color: var(--bt-ink); cursor: pointer; font-family: inherit; }
.bt-root .my-btn-line:hover { border-color: var(--bt-gold); color: var(--bt-gold-deep); }
.my-list { list-style: none; margin: 0; padding: 0; }
.my-list > li + li { border-top: 1px solid var(--bt-line); }
/* The profile and email cards (ProfileCard, EmailsCard) */
.bt-my-card { border-radius: 16px; border: 1px solid var(--bt-line); background: var(--bt-paper); padding: 24px; display: grid; gap: 14px; align-content: start; }
.bt-my-card > .bt-eyebrow { font-size: 12px; letter-spacing: .16em; color: var(--bt-ink); }
.bt-my-card h2.bt-h3 { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.bt-my-empty { color: var(--bt-body); font-size: 14px; }
.bt-my-list { list-style: none; margin: 0; padding: 0; }
.bt-my-list li { display: flex; justify-content: space-between; gap: 12px; padding: 11px 0; font-size: 14px; }
.bt-my-list li + li { border-top: 1px solid var(--bt-line); }
.bt-my-list li > span:first-child { color: var(--bt-ink); font-weight: 500; }
`;

export interface RailItem {
  href: string;
  label: string;
  icon: React.FC<{ size?: number }>;
  exact?: boolean;
  external?: boolean;
}

/** The side rail: where a member goes, then their account. A chip row on phones. */
export const MyRail: React.FC<{ centerSlug?: string | null }> = ({ centerSlug }) => {
  const pathname = usePathname() || "";
  const main: RailItem[] = [
    { href: "/my", label: "My Church", icon: IconHome, exact: true },
    { href: centerSlug ? "/locations/" + centerSlug : "/locations", label: "My center", icon: IconPin },
    { href: "/watch", label: "Watch", icon: IconPlay },
    { href: "/events", label: "Events", icon: IconCalendar },
    { href: "/next-steps", label: "Next steps", icon: IconStep },
    { href: "/my/giving", label: "My giving", icon: IconGift },
    { href: "/my/profile", label: "My details", icon: IconUser }
  ];
  const secondary: RailItem[] = [
    { href: "https://id.mbmonline.global/realms/marybanks/account", label: "Mary Banks ID", icon: IconSettings, external: true },
    { href: "/next-steps#contact", label: "Help", icon: IconHelp }
  ];
  const here = (i: RailItem) => !i.external && (i.exact ? pathname.endsWith(i.href) : pathname.endsWith(i.href) || pathname.includes(i.href + "/"));
  const link = (i: RailItem) => {
    const Icon = i.icon;
    return (
      <li key={i.href}>
        {i.external
          ? <a href={i.href}><Icon size={18} />{i.label}</a>
          : <Link href={i.href} aria-current={here(i) ? "page" : undefined}><Icon size={18} />{i.label}</Link>}
      </li>
    );
  };
  return (
    <aside className="my-rail">
      <nav aria-label="My Church">
        <ul>
          {main.map(link)}
          <li aria-hidden className="my-rail-rule" />
          {secondary.map(link)}
          <li><a className="my-out" href="/api/auth/mbid/logout" onClick={() => clearSessionCookies()}><IconLogout size={18} />Sign out</a></li>
        </ul>
      </nav>
    </aside>
  );
};

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; id?: string }> = ({ children, style, id }) => (
  <section className="my-card" style={style} id={id}>{children}</section>
);

export const CardHead: React.FC<{ title: string; sub?: string; href?: string; linkLabel?: string }> = ({ title, sub, href, linkLabel }) => (
  <div className="my-head">
    <div>
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
    {href && linkLabel && <Link href={href}>{linkLabel} <IconArrowRight size={14} /></Link>}
  </div>
);

/** "Good afternoon, Grace": the time of day is the member's own, so it's worked out here. */
export const Greeting: React.FC<{ name: string }> = ({ name }) => {
  const [word, setWord] = React.useState("Welcome");
  React.useEffect(() => {
    const h = new Date().getHours();
    setWord(h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);
  return (
    <h1 className="my-serif" style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.4rem)", fontWeight: 400, lineHeight: 1.15 }}>
      {word}, {name} <span aria-hidden>👋</span>
    </h1>
  );
};

export const money = (n: number, currency = "USD") => {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n); } catch { return "$" + n.toFixed(2); }
};

export const shortDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const ago = (iso?: string | null): string => {
  if (!iso) return "";
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [["second", 60], ["minute", 60], ["hour", 24], ["day", 7], ["week", 4.35], ["month", 12], ["year", Infinity]];
  let v = diff;
  for (const [unit, size] of steps) { if (Math.abs(v) < size) return rtf.format(Math.round(v), unit); v /= size; }
  return "";
};

/** Page frame for every My Church page: the rail beside the page's own content. */
export const MyFrame: React.FC<{ centerSlug?: string | null; children: React.ReactNode }> = ({ centerSlug, children }) => (
  <div className="my-wrap">
    <style dangerouslySetInnerHTML={{ __html: MY_CSS }} />
    <MyRail centerSlug={centerSlug} />
    <div className="my-main">{children}</div>
  </div>
);
