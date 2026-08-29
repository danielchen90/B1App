// Bible Teachers International — public landing page.
//
// ROUTING NOTE: this is a COMPONENT, not a `page.tsx`. A `(bt)/page.tsx` would resolve
// to the same `/[sdSlug]` index route as the CMS `(public)/page.tsx` and cause a hard
// "two parallel pages" build error. The shared index page delegates its render to
// <BtLanding/> for the BT public tenant; the `(bt)` group hosts the real sub-routes.
//
// Section order: gilded-globe hero (thesis) → latest message → ways to worship →
// world band (locations) → about/founder teaser → connect band → footer (shell).

import React from "react";
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { ApiHelper } from "@churchapps/apphelper";
import type { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadSermonFeed, type FeedSermon } from "@/helpers/SermonFeedHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "./btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { MeridianGlobe, SectionOrnament } from "@/components/public-bt/BtOrnaments";
import { LiveIndicator } from "@/components/public-bt/LiveIndicator";
import { BT, BT_COPY, BT_NATION_COUNT, getCampusExtras } from "@/components/public-bt/btSiteContent";
import { IconPin, IconGlobe, IconPlay, IconHeart, IconGift, IconArrowRight, IconYouTube } from "@/components/public-bt/BtIcons";

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
  const [campuses, content] = await Promise.all([
    loadVisibleCampuses(churchId),
    loadBtOrgContent(churchId)
  ]);
  const channel = content.sermonYoutubeChannel || BT.youtubeChannelId;
  const sermons = await loadSermonFeed(channel, 4);
  return { churchId, campuses, content, sermons };
});

export async function buildBtMetadata(config: ConfigurationInterface): Promise<Metadata> {
  const churchName = config.church?.name || BT.name;
  const { content } = await loadBtLandingData(config);
  const description = content.mission || BT_COPY.heroSub;
  return MetaHelper.getMetaData(churchName + " — " + BT.tagline, description, description, config.appearance);
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

// ── Small presentational pieces ─────────────────────────────────────────────────

const WorshipCard: React.FC<{ icon: React.ReactNode; title: string; copy: string; href: string; cta: string; external?: boolean }> =
  ({ icon, title, copy, href, cta, external }) => (
    <div className="bt-card bt-card-hover" style={{ padding: "34px 30px", display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={{ color: "var(--bt-gold-deep)" }}>{icon}</span>
      <h3 style={{ fontSize: "1.7rem" }}>{title}</h3>
      <p className="bt-muted-text" style={{ flex: 1, lineHeight: 1.7 }}>{copy}</p>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--bt-gold-deep)", fontWeight: 700 }}>
          {cta} <IconArrowRight size={16} />
        </a>
      ) : (
        <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--bt-gold-deep)", fontWeight: 700 }}>
          {cta} <IconArrowRight size={16} />
        </Link>
      )}
    </div>
  );

export const BtLanding: React.FC<{ config: ConfigurationInterface }> = async ({ config }) => {
  const { campuses, content, sermons } = await loadBtLandingData(config);
  const navLinks = toLocationLinks(campuses);
  const giveUrl = content.givingUrl || BT.giveUrl;
  const latest: FeedSermon | undefined = sermons[0];

  // Country roll-up for the world band.
  const countryCounts = new Map<string, { flag: string; n: number }>();
  campuses.forEach((c) => {
    const ex = getCampusExtras(c.slug);
    const country = ex?.country || "United States";
    const cur = countryCounts.get(country) || { flag: ex?.flag || "📍", n: 0 };
    cur.n += 1;
    countryCounts.set(country, cur);
  });

  return (
    <BtShell config={config} campuses={navLinks} giveUrl={giveUrl}>
      {/* ══ HERO — the gilded globe ══ */}
      <section className="bt-dark" style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--bt-line-dark)" }}>
        {/* congregation photo, sunk deep into the ink */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            backgroundImage:
              "linear-gradient(180deg, rgba(18,16,11,0.82) 0%, rgba(18,16,11,0.62) 45%, rgba(18,16,11,0.94) 100%), url('/bt/worship.jpg')",
            backgroundSize: "cover", backgroundPosition: "center 30%"
          }}
        />
        {/* the meridian globe rising from the fold */}
        <MeridianGlobe
          style={{ position: "absolute", left: "50%", bottom: -2, transform: "translateX(-50%)", width: "min(1200px, 130vw)", height: "auto", pointerEvents: "none" }}
        />
        <div style={{ position: "relative", maxWidth: "var(--bt-maxw)", margin: "0 auto", padding: "clamp(84px, 12vw, 150px) 22px clamp(96px, 13vw, 160px)", textAlign: "center" }}>
          <div style={{ minHeight: 32, marginBottom: 10 }}>
            <LiveIndicator streamKey={config.church?.subDomain || null} />
          </div>
          <div className="bt-eyebrow bt-rise" style={{ justifyContent: "center" }}>
            {BT.ministry}{" "}&middot; Bible Teachers International
          </div>
          <h1 className="bt-display bt-rise-2" style={{ maxWidth: 880, margin: "22px auto 0" }}>
            Teaching the Word<br />
            <em style={{ fontStyle: "italic", color: "var(--bt-gold-bright)" }}>to the nations.</em>
          </h1>
          <p className="bt-lede bt-muted-text bt-rise-3" style={{ maxWidth: 640, margin: "24px auto 36px" }}>
            {content.welcomeNote || BT_COPY.heroSub}
          </p>
          <div className="bt-rise-3" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="bt-btn" href="/locations"><IconPin size={18} /> Find a Worship Center</Link>
            <Link className="bt-btn bt-btn-ghost" href="/sermons"><IconPlay size={18} /> Watch the Latest Message</Link>
          </div>
          {/* stats strip */}
          <div
            className="bt-rise-3"
            style={{
              display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "14px 0",
              marginTop: 64, borderTop: "1px solid var(--bt-line-dark)", paddingTop: 26
            }}
          >
            {[
              [String(campuses.length || 24), "Worship Centers"],
              [String(BT_NATION_COUNT), "Nations"],
              ["One", "Word"]
            ].map(([n, label], i) => (
              <div key={label} style={{ padding: "0 34px", borderLeft: i === 0 ? "none" : "1px solid var(--bt-line-dark)", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--bt-display-font)", fontSize: "2rem", fontWeight: 600, color: "var(--bt-gold-bright)", lineHeight: 1.1 }}>{n}</div>
                <div style={{ fontFamily: "var(--bt-eyebrow-font)", fontSize: "0.66rem", letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--bt-ondark-muted)", marginTop: 5, whiteSpace: "nowrap" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LATEST MESSAGE ══ */}
      <section className="bt-section" id="sermons">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="bt-eyebrow">This Week&rsquo;s Teaching</div>
          <h2 className="bt-h2" style={{ marginTop: 14 }}>The Latest Message</h2>
        </div>
        {latest ? (
          <div style={{ maxWidth: 920, margin: "0 auto" }}>
            <div
              style={{
                position: "relative", width: "100%", aspectRatio: "16 / 9",
                borderRadius: "var(--bt-radius-lg)", overflow: "hidden",
                border: "1px solid var(--bt-line)", background: "#000",
                boxShadow: "0 24px 60px rgba(34,29,20,.18)"
              }}
            >
              <iframe
                src={"https://www.youtube-nocookie.com/embed/" + encodeURIComponent(latest.videoId)}
                title={latest.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginTop: 20 }}>
              <div>
                <div style={{ fontFamily: "var(--bt-display-font)", fontSize: "1.4rem", fontWeight: 600 }}>{latest.title}</div>
                {latest.publishedAt && <div className="bt-muted-text" style={{ fontSize: "0.9rem", marginTop: 3 }}>{formatDate(latest.publishedAt)}</div>}
              </div>
              <Link href="/sermons" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--bt-gold-deep)", fontWeight: 700 }}>
                Browse all messages <IconArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p className="bt-muted-text" style={{ marginBottom: 20 }}>Messages stream every week on the ministry&rsquo;s channel.</p>
            <a className="bt-btn" href={BT.youtubeUrl} target="_blank" rel="noopener noreferrer"><IconYouTube size={18} /> Watch on YouTube</a>
          </div>
        )}
      </section>

      {/* ══ WAYS TO WORSHIP ══ */}
      <section style={{ background: "#F3EDDD", borderTop: "1px solid var(--bt-line)", borderBottom: "1px solid var(--bt-line)" }}>
        <div className="bt-section">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div className="bt-eyebrow">Come, Worship With Us</div>
            <h2 className="bt-h2" style={{ marginTop: 14 }}>Three Ways to Gather</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 22 }}>
            <WorshipCard
              icon={<IconPin size={30} strokeWidth={1.3} />}
              title="In Person"
              copy={BT_COPY.whatToExpect}
              href="/locations"
              cta="Find your nearest center"
            />
            <WorshipCard
              icon={<IconGlobe size={30} strokeWidth={1.3} />}
              title="Online Church"
              copy={BT_COPY.onlineBlurb}
              href={BT.onlineChurchUrl}
              cta="Join the Online Church"
              external
            />
            <WorshipCard
              icon={<IconPlay size={30} strokeWidth={1.3} />}
              title="Watch Anytime"
              copy={BT_COPY.discipleship}
              href="/sermons"
              cta="Open the sermon library"
            />
          </div>
        </div>
      </section>

      {/* ══ THE WORLD BAND — locations ══ */}
      <section className="bt-dark" style={{ position: "relative", overflow: "hidden" }}>
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            backgroundImage:
              "linear-gradient(100deg, rgba(18,16,11,0.97) 38%, rgba(18,16,11,0.55) 100%), url('/bt/globe.jpg')",
            backgroundSize: "cover", backgroundPosition: "center right"
          }}
        />
        <div className="bt-section" style={{ position: "relative" }}>
          <div style={{ maxWidth: 560 }}>
            <div className="bt-eyebrow">{BT.commissionRef}</div>
            <h2 className="bt-h2" style={{ marginTop: 14 }}>
              One church, <em style={{ fontStyle: "italic", color: "var(--bt-gold-bright)" }}>six nations.</em>
            </h2>
            <p className="bt-lede bt-muted-text" style={{ marginTop: 18 }}>
              From the Gulf Coast to Kingston, Nassau to Mississauga, Couva to George Town —
              every worship center opens the same Book and teaches the same Word.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 26 }}>
              {[...countryCounts.entries()].map(([country, { flag, n }]) => (
                <span
                  key={country}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    border: "1px solid var(--bt-line-dark)", borderRadius: 999,
                    padding: "7px 15px", fontSize: "0.88rem", color: "var(--bt-ondark)"
                  }}
                >
                  <span aria-hidden>{flag}</span> {country}
                  <span style={{ color: "var(--bt-gold-bright)", fontWeight: 700 }}>{n}</span>
                </span>
              ))}
            </div>
            <div style={{ marginTop: 34 }}>
              <Link className="bt-btn" href="/locations"><IconPin size={17} /> Explore the Map</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ABOUT TEASER ══ */}
      <section className="bt-section">
        <SectionOrnament />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48, alignItems: "center", marginTop: 44 }}>
          <div>
            <div className="bt-eyebrow">Our Story</div>
            <h2 className="bt-h2" style={{ marginTop: 14 }}>
              Taught by the Book,<br />led by the Spirit.
            </h2>
            <p className="bt-lede bt-muted-text" style={{ marginTop: 20 }}>
              {content.about || BT_COPY.aboutShort}
            </p>
            <div style={{ marginTop: 28 }}>
              <Link className="bt-btn bt-btn-outline" href="/about">About the Ministry</Link>
            </div>
          </div>
          <div
            aria-hidden
            style={{
              backgroundImage: "url('/bt/gathering.jpg')",
              backgroundSize: "cover", backgroundPosition: "center",
              borderRadius: "var(--bt-radius-lg)", border: "1px solid var(--bt-line)",
              minHeight: 360, boxShadow: "0 24px 60px rgba(34,29,20,.16)"
            }}
          />
        </div>
      </section>

      {/* ══ CONNECT BAND ══ */}
      <section style={{ background: "#F3EDDD", borderTop: "1px solid var(--bt-line)" }}>
        <div className="bt-section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 22 }}>
            <div className="bt-card bt-card-hover" style={{ padding: "34px 30px" }}>
              <span style={{ color: "var(--bt-gold-deep)" }}><IconHeart size={30} strokeWidth={1.3} /></span>
              <h3 style={{ fontSize: "1.7rem", margin: "14px 0 10px" }}>Need prayer?</h3>
              <p className="bt-muted-text" style={{ lineHeight: 1.7, marginBottom: 18 }}>
                Our prayer team would be honored to stand with you. Share what&rsquo;s on your heart — no account needed.
              </p>
              <Link className="bt-btn" href="/connect">Send a Prayer Request</Link>
            </div>
            <div className="bt-card bt-card-hover" style={{ padding: "34px 30px" }}>
              <span style={{ color: "var(--bt-gold-deep)" }}><IconGift size={30} strokeWidth={1.3} /></span>
              <h3 style={{ fontSize: "1.7rem", margin: "14px 0 10px" }}>Sow into the work</h3>
              <p className="bt-muted-text" style={{ lineHeight: 1.7, marginBottom: 18 }}>
                Your giving carries the teaching of the Word across six nations — and keeps every worship center&rsquo;s doors open.
              </p>
              <Link className="bt-btn bt-btn-outline" href="/give">Ways to Give</Link>
            </div>
          </div>
        </div>
      </section>
    </BtShell>
  );
};
