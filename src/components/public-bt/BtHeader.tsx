"use client";

// Bible Teachers sticky top bar, in the Mary Banks family look: white, a hairline
// under it, the mark on the left, the five-item menu, then the actions (the Mary
// Banks sites switcher, Give, and Sign in). Under 960px the menu folds into the
// sidebar behind the hamburger. Give always goes to the site's own Give page, which
// offers the ministry and every center, rather than straight out to a payment page.

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BtBrand } from "./BtBrand";
import { BtSidebar } from "./BtSidebar";
import { BtAppSwitcher } from "./BtAppSwitcher";
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
.bt-header-in { max-width: var(--bt-maxw); margin: 0 auto; padding: 10px 20px; display: flex; align-items: center; gap: 16px; }
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
          <Link href="/" aria-label="Bible Teachers International home">
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
            <BtAppSwitcher />
            <Link className="bt-btn bt-btn-sm bt-give-top" href="/give">Give</Link>
            <BtAccountButton />
            <button type="button" className="bt-burger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <IconMenu size={22} />
            </button>
          </div>
        </div>
      </header>

      <BtSidebar open={menuOpen} onClose={() => setMenuOpen(false)} campuses={campuses} giveUrl={giveUrl} />
    </>
  );
};
