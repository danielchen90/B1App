"use client";

// Bible Teachers sticky top bar, in the Mary Banks family look: white, a hairline
// under it, the mark on the left, the five-item menu, then the actions (Give and
// Sign in). The Mary Banks sites switcher is the hosted one every Mary Banks site
// loads (ecosystem.mbmonline.global); it sits fixed in the top corner, and the bar
// leaves it room at its end. Under 960px the menu folds into the
// sidebar behind the hamburger. Give always goes to the site's own Give page, which
// offers the ministry and every center, rather than straight out to a payment page.

import React from "react";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { BtBrand } from "./BtBrand";
import { BtSidebar } from "./BtSidebar";
import { BtAccountButton } from "./BtAccountButton";
import { BT_NAV } from "./btSiteContent";
import { IconMenu } from "./BtIcons";
import type { LocationLink } from "./LocationsMenu";

interface Props {
  campuses: LocationLink[];
  giveUrl?: string | null;
}

const CSS = `
.bt-header { position: sticky; top: 0; z-index: 80; background: rgba(255,255,255,.94);
  backdrop-filter: saturate(160%) blur(10px); -webkit-backdrop-filter: saturate(160%) blur(10px);
  border-bottom: 1px solid var(--bt-line); }
.bt-header-in { max-width: var(--bt-maxw); margin: 0 auto; padding: 10px 20px; padding-inline-end: 76px; display: flex; align-items: center; gap: 16px; }
.bt-nav { display: flex; align-items: center; gap: 2px; margin-left: auto; }
.bt-nav a { font-weight: 500; font-size: 0.95rem; padding: 9px 12px; border-radius: 10px; color: var(--bt-body); }
.bt-nav a:hover { color: var(--bt-ink); background: var(--bt-sunk); }
.bt-nav a[aria-current="page"] { color: var(--bt-ink); font-weight: 600; box-shadow: inset 0 -2px 0 var(--bt-gold); border-radius: 10px 10px 0 0; }
.bt-actions { display: flex; align-items: center; gap: 6px; }
.bt-burger { display: none; width: 40px; height: 40px; border-radius: 10px; border: 0; background: transparent; color: var(--bt-ink); cursor: pointer; align-items: center; justify-content: center; }
.bt-burger:hover { background: var(--bt-sunk); }
@media (max-width: 960px) {
  .bt-nav { display: none; }
  .bt-actions { margin-left: auto; }
  .bt-burger { display: inline-flex; }
}
@media (max-width: 420px) { .bt-give-top { display: none !important; } }
/* Phone widths: tighten the bar so the wordmark never runs under the actions. */
@media (max-width: 400px) {
  .bt-header-in { padding: 10px 12px; padding-inline-end: 68px; gap: 8px; }
  .bt-actions { gap: 2px; }
  .bt-header .bt-brand-sub { letter-spacing: 0.14em !important; }
}
@media (max-width: 360px) {
  .bt-header .bt-brand-name { font-size: 0.92rem !important; }
  .bt-header .bt-brand-sub { display: none; }
}
@media (max-width: 340px) {
  .bt-header .bt-brand-words { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
}
`;

export const BtHeader: React.FC<Props> = ({ campuses, giveUrl }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pathname = usePathname() || "/";
  // The tenant segment may prefix the path when rendered via the rewrite; compare tails.
  const isActive = (href: string) => pathname.endsWith(href) || pathname.includes(href + "/");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="bt-header">
        <div className="bt-header-in">
          <Link href="/">
            <BtBrand size="sm" />
          </Link>

          <nav className="bt-nav" aria-label="Primary">
            {BT_NAV.map((l) => (
              <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="bt-actions">
            <Link className="bt-btn bt-btn-sm bt-give-top" href="/give">Give</Link>
            <BtAccountButton />
            <button type="button" className="bt-burger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <IconMenu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* The nine-dot Mary Banks sites switcher, hosted once for every site. */}
      <Script src="https://ecosystem.mbmonline.global/switcher.js" data-current="worship-centers" strategy="afterInteractive" />

      <BtSidebar open={menuOpen} onClose={() => setMenuOpen(false)} campuses={campuses} giveUrl={giveUrl} />
    </>
  );
};
