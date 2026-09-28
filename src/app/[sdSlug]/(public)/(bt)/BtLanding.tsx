// Bible Teachers International — public landing page.
//
// ROUTING NOTE: this is a COMPONENT, not a `page.tsx`. A `(bt)/page.tsx` would resolve
// to the same `/[sdSlug]` index route as the CMS `(public)/page.tsx` and cause a hard
// "two parallel pages" build error. The shared index page delegates its render to
// <BtLanding/> for the BT public tenant; the `(bt)` group hosts the real sub-routes.
//
// 2026-09 redesign. The page is built around "your center", the way multi-campus
// churches work: a worship-photo hero, the visitor's remembered worship center and My
// Church on the dock that rises over it, then the
// week's live gatherings, the latest message, "I want to...", upcoming events, the
// six nations, and giving/partnership. Section order is the product decision; keep it.

import React from "react";
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { ApiHelper } from "@churchapps/apphelper";
import type { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { btSeo } from "@/components/public-bt/btSeo";
import { loadSermonFeed, type FeedSermon } from "@/helpers/SermonFeedHelper";
import { loadLocatorCampuses } from "@/helpers/LocatorCampusHelper";
import { loadPublicEvents } from "@/helpers/PublicEventsHelper";
import { toLocationLinks } from "./btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { BtHomeHero } from "@/components/public-bt/BtHomeHero";
import { ThisWeek } from "@/components/public-bt/ThisWeek";
import { MessageCard } from "@/components/public-bt/MessageCard";
import { EventCards } from "@/components/public-bt/EventCards";
import { BT, BT_COPY, BT_STEPS, BT_COUNTRY_ORDER, BT_LINKS } from "@/components/public-bt/btSiteContent";
import { IconArrowRight, IconPin, IconGift, IconHeart } from "@/components/public-bt/BtIcons";


interface BtOrgContent {
  mission?: string;
  about?: string;
  welcomeNote?: string;
  givingUrl?: string;
  sermonYoutubeChannel?: string;
}

/** Org-default resolved public content — authored copy fills any gap. */
const loadBtOrgContent = cache(async (churchId: string): Promise<BtOrgContent> => {
  if (!churchId) return {};
  try {
    const data = await ApiHelper.getAnonymous("/campusContent/public/" + churchId, "MembershipApi");
    return data && typeof data === "object" ? (data as BtOrgContent) : {};
  } catch {
    return {};
  }
});

/** Shared per-request loader — the page + generateMetadata resolve to ONE set of fetches. */
export const loadBtLandingData = cache(async (config: ConfigurationInterface) => {
  const churchId = config.church?.id || "";
  const [centers, content, events] = await Promise.all([
    loadLocatorCampuses(churchId),
    loadBtOrgContent(churchId),
    loadPublicEvents(churchId)
  ]);
  const channel = content.sermonYoutubeChannel || BT.youtubeChannelId;
  const sermons = await loadSermonFeed(channel, 4);
  return { churchId, centers, content, sermons, events };
});

export async function buildBtMetadata(config: ConfigurationInterface): Promise<Metadata> {
  const churchName = config.church?.name || BT.name;
  const { content } = await loadBtLandingData(config);
  const description = content.mission || BT_COPY.heroSub;
  return btSeo(MetaHelper.getMetaData(churchName + " | " + BT.tagline, description, description, config.appearance), "/");
}

const CSS = `
.bt-msgs { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 28px; }
.bt-msgs-side { display: grid; gap: 22px; align-content: start; }
@media (max-width: 900px) { .bt-msgs { grid-template-columns: 1fr; } .bt-msgs-side { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); } }
.bt-steps { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
.bt-step { display: grid; gap: 4px; padding: 18px 20px; background: var(--bt-paper); border: 1px solid var(--bt-line); border-radius: var(--bt-radius); }
.bt-step b { font-weight: 600; color: var(--bt-ink); display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.bt-step span { font-size: .92rem; color: var(--bt-muted); }
.bt-step:hover { border-color: rgba(184,145,42,.5); box-shadow: var(--bt-shadow); }
.bt-nations { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 32px; align-items: center; }
@media (max-width: 800px) { .bt-nations { grid-template-columns: 1fr; } }
.bt-duo { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; }
.bt-duo .bt-card { padding: 28px; display: grid; gap: 10px; align-content: start; }
`;

export const BtLanding: React.FC<{ config: ConfigurationInterface }> = async ({ config }) => {
  const { centers, sermons, events } = await loadBtLandingData(config);
  const navLinks = toLocationLinks(centers);
  const latest: FeedSermon | undefined = sermons[0];
  const recent = sermons.slice(1, 4);
  const physical = centers.filter((c) => !c.virtual);

  // Country roll-up for the nations band, in the fellowship's own order.
  const countries = new Map<string, { flag: string; n: number }>();
  centers.forEach((c) => {
    const cur = countries.get(c.country) || { flag: c.flag, n: 0 };
    cur.n += 1;
    countries.set(c.country, cur);
  });
  const rank = (name: string) => { const i = BT_COUNTRY_ORDER.indexOf(name); return i === -1 ? 99 : i; };
  const countryList = [...countries.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
  const nations = countryList.filter(([name]) => name !== "Online").length;

  return (
    <BtShell config={config} campuses={navLinks}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ══ HERO: worship photography, the welcome, then your center + My Church on the dock ══ */}
      <BtHomeHero centers={centers} physicalCount={physical.length} nations={nations} streamKey={config.church?.subDomain || null} />

      {/* ══ THIS WEEK ══ */}
      <section className="bt-section-tight">
        <div className="bt-section-head">
          <div>
            <div className="bt-eyebrow">This week</div>
            <h2 className="bt-h2">Gather with us, in person or online</h2>
          </div>
          <Link className="bt-link" href="/watch">How to watch <IconArrowRight size={15} /></Link>
        </div>
        <ThisWeek streamKey={config.church?.subDomain || null} />
      </section>

      {/* ══ LATEST MESSAGE ══ */}
      {latest && (
        <section className="bt-band">
          <div className="bt-section">
            <div className="bt-section-head">
              <div>
                <div className="bt-eyebrow">The latest message</div>
                <h2 className="bt-h2">Sit under the Word</h2>
              </div>
              <Link className="bt-link" href="/watch">All messages <IconArrowRight size={15} /></Link>
            </div>
            <div className="bt-msgs">
              <MessageCard sermon={latest} feature />
              {recent.length > 0 && (
                <div className="bt-msgs-side">
                  {recent.map((s) => <MessageCard key={s.videoId} sermon={s} />)}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══ I WANT TO... ══ */}
      <section className="bt-section">
        <div className="bt-section-head">
          <div>
            <div className="bt-eyebrow">Next steps</div>
            <h2 className="bt-h2">I want to&hellip;</h2>
          </div>
        </div>
        <div className="bt-steps">
          {BT_STEPS.map((s) => {
            const external = s.id === "grow" || s.id === "partner";
            const href = s.id === "grow" ? BT_LINKS.growthPaths : s.id === "partner" ? BT_LINKS.partners : "/next-steps#" + s.id;
            const inner = (
              <>
                <b>{s.label} <IconArrowRight size={15} /></b>
                <span>{s.blurb}</span>
              </>
            );
            return external
              ? <a key={s.id} className="bt-step" href={href}>{inner}</a>
              : <Link key={s.id} className="bt-step" href={href}>{inner}</Link>;
          })}
        </div>
      </section>

      {/* ══ UPCOMING EVENTS (hidden until any are published) ══ */}
      {events.length > 0 && (
        <section className="bt-band">
          <div className="bt-section">
            <div className="bt-section-head">
              <div>
                <div className="bt-eyebrow">Coming up</div>
                <h2 className="bt-h2">Upcoming events</h2>
              </div>
              <Link className="bt-link" href="/events">All events <IconArrowRight size={15} /></Link>
            </div>
            <EventCards events={events} limit={6} />
          </div>
        </section>
      )}

      {/* ══ ONE CHURCH, N NATIONS ══ */}
      <section className="bt-section">
        <div className="bt-nations">
          <div>
            <div className="bt-eyebrow">{BT.commissionRef}</div>
            <h2 className="bt-h2" style={{ marginTop: 8 }}>One church, {nations === 6 ? "six" : nations} nations.</h2>
            <p className="bt-lede" style={{ marginTop: 14, maxWidth: 520 }}>
              From the Gulf Coast to Kingston, Nassau to Mississauga, Couva to George Town, every worship center opens the same Book and teaches the same Word.
            </p>
            <div style={{ marginTop: 22 }}>
              <Link className="bt-btn bt-btn-outline" href="/locations"><IconPin size={18} /> See every center on the map</Link>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {countryList.map(([name, { flag, n }]) => (
              <Link key={name} className="bt-chip" href={"/locations#" + encodeURIComponent(name)}>
                <span aria-hidden>{flag}</span> {name}
                <span style={{ color: "var(--bt-gold-deep)", fontWeight: 600 }}>{n}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GIVE + PARTNER ══ */}
      <section className="bt-band">
        <div className="bt-section">
          <div className="bt-duo">
            <div className="bt-card">
              <span style={{ color: "var(--bt-gold)" }}><IconGift size={24} /></span>
              <h3 className="bt-h3">Sow into the work</h3>
              <p>Give to your worship center or to the ministry: once, or every month. Simple and secure.</p>
              <div><Link className="bt-btn" href="/give">Give</Link></div>
            </div>
            <div className="bt-card">
              <span style={{ color: "var(--bt-live)" }}><IconHeart size={24} /></span>
              <h3 className="bt-h3">Become a partner</h3>
              <p>Partners keep the books, courses and teaching free for everyone, and carry them to the nations.</p>
              <div><a className="bt-btn bt-btn-outline" href={BT_LINKS.partners}>Partner with us</a></div>
            </div>
          </div>
        </div>
      </section>
    </BtShell>
  );
};
