// Per-worship-center detail page — /locations/[campusSlug].
//
// An RSC that resolves the campus by slug off the anonymous campus list (unknown slug →
// notFound; renamed-alias 301 path stays wired for when the API exposes aliases), loads
// the four anonymous public reads in parallel, merges the resolved campusContent with
// the in-repo enrichment map (service times / contacts / socials from the ministry's
// published site), and renders: a full-bleed photo hero → an at-a-glance bar → events →
// service times → find us → latest message + give → past messages → the pastor's word →
// photos → leadership → forms. Sections with nothing to show are left out, and each
// rises into view on scroll (RevealOnScroll). Messages come from the center's own YouTube
// channel (CenterChannelHelper): the latest plus the past 10, or the ministry's latest
// when the center has no channel.
//
// PATH NOTE: the "MembershipApi" base already ends in "/membership" — client paths never
// re-prefix it. The sermon read is on "ContentApi".

import React, { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApiHelper } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { btSeo, btTitle, btDescription } from "@/components/public-bt/btSeo";
import { JsonLd, btChurchGraph, usStateAbbr } from "@/components/public-bt/BtJsonLd";
import type { PublicCampus } from "@/helpers/PublicCampusHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { SocialLinks } from "@/components/public-bt/SocialLinks";
import { LeadershipGrid, type PublicLeader } from "@/components/public-bt/LeadershipGrid";
import { MessageCard } from "@/components/public-bt/MessageCard";
import { PhotoGallery } from "@/components/public-bt/PhotoGallery";
import { CenterHero } from "@/components/public-bt/CenterHero";
import { CenterEvents } from "@/components/public-bt/CenterEvents";
import { CenterMap } from "@/components/public-bt/CenterMap";
import { ServiceRhythm, NextGatheringText } from "@/components/public-bt/ServiceRhythm";
import { RevealOnScroll } from "@/components/public-bt/RevealOnScroll";
import { TrackOnView } from "@/components/public-bt/BtAnalytics";
import { trackAttrs } from "@/lib/analytics";
import { NextStepForm } from "@/components/public-bt/forms/NextStepForm";
import { loadSermonFeed } from "@/helpers/SermonFeedHelper";
import { channelFromContent } from "@/helpers/CenterChannelHelper";
import { MessageLibrary } from "@/components/public-bt/MessageLibrary";
import { loadPublicEvents } from "@/helpers/PublicEventsHelper";
import { BT, BT_COPY, centerTimeZone, getCampusExtras } from "@/components/public-bt/btSiteContent";
import { IconPhone, IconMail, IconGlobe, IconPin, IconClock, IconUser, IconArrowRight, IconGift, IconYouTube } from "@/components/public-bt/BtIcons";
import {
  type CampusContent,
  type ServiceTime,
  type ExtraLink,
  HIDDEN,
  firstPhoto
} from "@/components/public-bt/campusContentTypes";

type PageParams = { sdSlug: string; campusSlug: string };

interface ResolvedCampus {
  campus: PublicCampus;
  redirectToSlug?: string;
}

/** Resolve the campus for a requested slug (exact current-slug match; alias-301 dormant). */
const resolveCampusBySlug = cache(
  async (churchId: string, campusSlug: string): Promise<ResolvedCampus | null> => {
    const campuses = await loadVisibleCampuses(churchId);
    const wanted = (campusSlug || "").toLowerCase();

    const current = campuses.find((c) => (c.slug || "").toLowerCase() === wanted);
    if (current && current.slug) return { campus: current };

    for (const c of campuses) {
      const aliases: string[] = Array.isArray((c as any).aliasSlugs) ? (c as any).aliasSlugs : [];
      if (c.slug && aliases.some((a) => (a || "").toLowerCase() === wanted)) {
        return { campus: c, redirectToSlug: c.slug };
      }
    }
    return null;
  }
);

const loadCampusContent = cache(async (churchId: string, campusId: string): Promise<CampusContent> => {
  if (!churchId || !campusId) return {};
  try {
    const data = await ApiHelper.getAnonymous(
      "/campusContent/public/" + churchId + "/" + campusId,
      "MembershipApi"
    );
    return data && typeof data === "object" ? (data as CampusContent) : {};
  } catch {
    return {};
  }
});

const loadLeadership = cache(async (churchId: string): Promise<PublicLeader[]> => {
  if (!churchId) return [];
  try {
    const data = await ApiHelper.getAnonymous("/public/" + churchId + "/leadership", "MembershipApi");
    return Array.isArray(data) ? (data as PublicLeader[]) : [];
  } catch {
    return [];
  }
});

// HIDDEN-aware readers: treat the explicit-hide sentinel as absent.
const str = (v: string | typeof HIDDEN | undefined): string => (v && v !== HIDDEN ? v : "");
const list = <T,>(v: T[] | typeof HIDDEN | undefined): T[] => (Array.isArray(v) ? v : []);

/** "Fort Lauderdale, FL", "Mississauga, ON", "Half Way Tree, Jamaica": the center's name plus its region. */
const centerPlace = (campus: PublicCampus, country: string): string => {
  const US_SUFFIX = /\s+(Alabama|Florida|Georgia|Louisiana|Mississippi|Texas)$/i;
  const name = campus.name.replace(US_SUFFIX, "").trim();
  if (country === "United States") return name + (campus.state ? ", " + usStateAbbr(campus.state) : "");
  if (country === "Canada") return name + (campus.state ? ", " + (/^ontario$/i.test(campus.state) ? "ON" : campus.state) : "");
  if (!country || country === "Online" || country.toLowerCase().startsWith(name.toLowerCase())) return country && country !== "Online" ? country : name;
  return name + ", " + country;
};

const timesSummary = (times: ServiceTime[]): string =>
  times.slice(0, 2).map((t) => t.day + " " + t.time.replace(/\s*(ET|EST|EDT)$/i, "") + (t.label ? " " + t.label.replace(/^(?!Bible\b)./, (c) => c.toLowerCase()) : "")).join(", ");

/** The center's search description (also its structured-data description), at most 160 characters. */
const centerDescription = (campus: PublicCampus, content: CampusContent): string => {
  const extras = getCampusExtras(campus.slug);
  const virtual = !!extras?.virtual;
  const place = centerPlace(campus, extras?.country || "");
  const apiTimes = list<ServiceTime>(content.serviceTimes);
  const times = apiTimes.length > 0 ? apiTimes : (extras?.serviceTimes || []);
  const welcome = str(content.welcomeNote);
  if (welcome) return btDescription(welcome);
  const lead = virtual
    ? "Join the " + BT.name + " " + campus.name + " from anywhere" + (times.length ? ": " + timesSummary(times) : "") + "."
    : "Worship with " + BT.name + " in " + place + (times.length ? ": " + timesSummary(times) : "") + ".";
  const tails = virtual ? [" Live services, discipleship and prayer.", " Join us live."] : [" Directions and how to plan your visit.", " Plan your visit."];
  const fit = tails.map((t) => lead + t).find((d) => d.length <= 160);
  return btDescription(fit || lead);
};

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug, campusSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const resolved = await resolveCampusBySlug(churchId, campusSlug);

  if (!resolved) return { ...MetaHelper.getMetaData(btTitle("Worship center not found"), BT.name, BT.name, config.appearance), robots: { index: false } };

  const campus = resolved.campus;
  const extras = getCampusExtras(campus.slug);
  const content = await loadCampusContent(churchId, campus.id);
  const virtual = !!extras?.virtual;
  const place = centerPlace(campus, extras?.country || "");
  const title = virtual ? btTitle(BT.name + " " + campus.name) : btTitle(BT.name + " Church in " + place);
  const description = centerDescription(campus, content);
  // Share card: the center's own photo (hero image, else first gallery photo) when it has one.
  const photo = firstPhoto(content);
  return btSeo(MetaHelper.getMetaData(title, description, description, config.appearance), "/locations/" + (campus.slug || campusSlug), { image: photo, imageAlt: campus.name + " worship center" });
}

export default async function CampusDetailPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, campusSlug } = await params;

  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";

  const resolved = await resolveCampusBySlug(churchId, campusSlug);
  if (!resolved) notFound();
  if (resolved.redirectToSlug && resolved.redirectToSlug !== campusSlug) {
    redirect("/locations/" + resolved.redirectToSlug);
  }
  const campus = resolved.campus;
  const extras = getCampusExtras(campus.slug);
  const virtual = !!extras?.virtual;

  const content = await loadCampusContent(churchId, campus.id);
  const ownChannel = await channelFromContent(content, campus.slug);
  const [leaders, events, allCampuses, sermons] = await Promise.all([
    loadLeadership(churchId),
    loadPublicEvents(churchId, campus.id),
    loadVisibleCampuses(churchId),
    loadSermonFeed(ownChannel?.channelId || BT.youtubeChannelId, ownChannel ? 11 : 1)
  ]);
  const [sermon, ...pastSermons] = sermons;

  const navLinks = toLocationLinks(allCampuses);
  const giveUrl = str(content.givingUrl) || extras?.givingUrl || BT.giveUrl;

  const apiTimes = list<ServiceTime>(content.serviceTimes);
  const serviceTimes: ServiceTime[] = apiTimes.length > 0 ? apiTimes : (extras?.serviceTimes || []);
  const extraLinks: ExtraLink[] = list<ExtraLink>(content.extraLinks);
  const photos = [str(content.heroImage), ...list<string>(content.photos)].filter((p, i, a) => !!p && a.indexOf(p) === i);
  const cover = photos[0] || "/bt/gathering.jpg";

  const pastor = str(content.leaders) || extras?.leaders || "";
  const phone = str(content.phone) || extras?.phone;
  const email = str(content.email) || extras?.email;
  const website = extras?.websiteUrl;
  const welcome = str(content.welcomeNote) || extras?.welcome ||
    (virtual
      ? BT_COPY.onlineBlurb
      : "Welcome home. Whoever you are and wherever you're from, there's a seat for you at " + campus.name + ". Come and be taught of the Lord.");
  const firstVisit = str(content.whatToExpect) || extras?.whatToExpect || BT_COPY.whatToExpect;

  const cityLine = [campus.city, campus.state].filter(Boolean).join(", ") + (campus.zip ? " " + campus.zip : "");
  const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent([campus.address1, campus.city, campus.state, campus.zip].filter(Boolean).join(", ") || campus.name);
  const thisCenter = [{ id: campus.id, slug: campus.slug, name: campus.name, virtual }];
  // Analytics: the same church properties on every event from this page.
  const churchProps = { church_id: campus.id, church_slug: campus.slug || "", church_name: campus.name, city: campus.city || "", country: extras?.country || "", virtual };

  const timeZone = centerTimeZone(campus.slug);
  const place = [campus.address1, cityLine.trim()].filter(Boolean).join(", ");
  const facebookUrl = str(content.facebookUrl) || extras?.facebookUrl || null;
  const instagramUrl = str(content.instagramUrl) || extras?.instagramUrl || null;
  const youtubeUrl = str(content.youtubeUrl) || extras?.youtubeUrl || null;
  const pastorNote = str(content.pastorNote);
  const showMap = !virtual && typeof campus.latitude === "number" && typeof campus.longitude === "number";

  const CSS = `
.bt-glance-wrap { position: relative; z-index: 2; max-width: var(--bt-maxw); margin: -58px auto 0; padding: 0 20px; }
.bt-glance { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); background: var(--bt-paper); border-radius: 22px; box-shadow: 0 30px 60px -36px rgba(24,24,32,.45), 0 0 0 1px var(--bt-line); overflow: hidden; }
.bt-glance > div { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; align-items: center; padding: 22px 24px; border-left: 1px solid var(--bt-line); }
.bt-glance > div:first-child { border-left: 0; }
.bt-glance svg { grid-row: span 2; color: var(--bt-gold); }
.bt-glance small { font-size: .72rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--bt-muted); }
.bt-glance b, .bt-glance a { font-weight: 600; color: var(--bt-ink); line-height: 1.35; overflow-wrap: anywhere; }
.bt-glance a:hover { color: var(--bt-gold-deep); }
.bt-sec-sub { max-width: 620px; margin-top: 10px; }
.bt-aside { padding: 26px; display: grid; gap: 14px; align-content: start; background: var(--bt-sunk); border: 0; }
.bt-find { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 18px; align-items: stretch; }
.bt-find-map { position: relative; min-height: 380px; border-radius: var(--bt-radius-lg); overflow: hidden; border: 1px solid var(--bt-line); }
.bt-find-card { padding: 28px; display: grid; gap: 18px; align-content: start; }
.bt-contacts { display: grid; gap: 10px; }
.bt-contacts a { display: inline-flex; align-items: center; gap: 10px; color: var(--bt-body); overflow-wrap: anywhere; }
.bt-contacts a:hover { color: var(--bt-ink); }
.bt-contacts svg { color: var(--bt-gold); flex: none; }
.bt-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 22px; align-items: start; }
.bt-give { position: relative; overflow: hidden; padding: 30px; display: grid; gap: 14px; align-content: start; border-radius: var(--bt-radius-lg); }
.bt-give::after { content: ""; position: absolute; right: -60px; bottom: -60px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(240,191,76,.28), transparent 70%); }
.bt-quote { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 22px; padding: clamp(26px, 4vw, 44px); }
.bt-quote-mark { font-family: var(--bt-display-font); font-size: 5.5rem; line-height: .7; color: var(--bt-gold); }
.bt-quote p { font-family: var(--bt-display-font); font-size: clamp(1.35rem, 2.4vw, 1.75rem); line-height: 1.4; color: var(--bt-ink); white-space: pre-line; }
.bt-quote cite { display: block; margin-top: 16px; font-style: normal; font-weight: 600; color: var(--bt-gold-deep); }
@media (max-width: 860px) { .bt-find { grid-template-columns: 1fr; } .bt-find-map { min-height: 300px; } }
@media (max-width: 560px) { .bt-glance > div { border-left: 0; border-top: 1px solid var(--bt-line); } .bt-glance > div:first-child { border-top: 0; } }
`;

  const firstVisitCard = (
    <div className="bt-card bt-aside bt-reveal" style={{ ["--d" as any]: 2 }}>
      <div className="bt-eyebrow">{virtual ? "Joining online" : "Your first visit"}</div>
      <p style={{ whiteSpace: "pre-line" }}>{firstVisit}</p>
      <div><a className="bt-btn" href="#visit">{virtual ? "Say hello" : "Plan your visit"}</a></div>
    </div>
  );

  return (
    <BtShell config={config} campuses={navLinks} giveUrl={giveUrl}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <RevealOnScroll />
      <TrackOnView event="church_viewed" props={churchProps} />
      <JsonLd
        data={btChurchGraph({
          slug: campus.slug || campusSlug,
          name: campus.name,
          description: centerDescription(campus, content),
          address1: campus.address1,
          city: campus.city,
          state: campus.state,
          zip: campus.zip,
          country: extras?.country,
          latitude: campus.latitude,
          longitude: campus.longitude,
          phone,
          email,
          image: photos[0],
          website,
          virtual,
          serviceTimes,
          sameAs: [facebookUrl, instagramUrl, youtubeUrl].filter((u): u is string => !!u)
        })}
      />

      {/* (1) Hero: the center's photo edge to edge, with its name, welcome and next steps over it */}
      <CenterHero
        name={campus.name}
        eyebrow={(extras?.flag ? extras.flag + " " : "") + (virtual ? "Online, join from anywhere" : (extras?.country || "Worship center"))}
        welcome={welcome}
        cover={cover}
        photoCredit={photos[0] === str(content.heroImage) ? extras?.photoCredit : undefined}
        pastor={pastor}
        times={serviceTimes.slice(0, 2).map((t) => t.day + " " + t.time).join(" · ")}
        place={place}
        virtual={virtual}
        slug={campus.slug}
        liveKey={config.church?.subDomain || null}
        primary={virtual && website
          ? { label: "Join the " + campus.name, href: website, external: true, attrs: trackAttrs("online_church_joined", { ...churchProps, placement: "center_page" }) }
          : { label: virtual ? "Join us" : "Plan your visit", href: "#visit" }}
        directions={virtual ? null : { label: "Directions", href: directionsUrl, external: true, attrs: trackAttrs("church_directions_clicked", { ...churchProps, placement: "center_page" }) }}
        nextHref="#glance"
      />

      {/* (2) At a glance: the four things a visitor checks first */}
      <div id="glance" className="bt-glance-wrap" style={{ scrollMarginTop: 90 }}>
        <div className="bt-glance bt-reveal">
          {serviceTimes.length > 0 && (
            <div><IconClock size={22} /><small>Next gathering</small><b><NextGatheringText times={serviceTimes} timeZone={timeZone} /></b></div>
          )}
          {pastor && <div><IconUser size={22} /><small>Pastor</small><b>{pastor}</b></div>}
          {virtual
            ? <div><IconGlobe size={22} /><small>Where</small><b>Online, from anywhere</b></div>
            : place && <div><IconPin size={22} /><small>Where</small><a href={directionsUrl} target="_blank" rel="noopener noreferrer">{campus.city || place}</a></div>}
          {phone
            ? <div><IconPhone size={22} /><small>Call</small><a href={"tel:" + phone.replace(/[^+\d]/g, "")} {...trackAttrs("church_contact_clicked", { ...churchProps, method: "phone" })}>{phone}</a></div>
            : email && <div><IconMail size={22} /><small>Write</small><a href={"mailto:" + email} {...trackAttrs("church_contact_clicked", { ...churchProps, method: "email" })}>{email}</a></div>}
        </div>
      </div>

      {/* (3) Events: what is on now and next at this center (and network-wide) */}
      {events.length > 0 && (
        <section id="events" className="bt-section-tight" style={{ paddingTop: "clamp(48px, 7vw, 80px)" }}>
          <div className="bt-section-head bt-reveal">
            <div><div className="bt-eyebrow">Coming up</div><h2 className="bt-h2">Events at {campus.name}</h2></div>
            <Link className="bt-link" href="/events">All events <IconArrowRight size={15} /></Link>
          </div>
          <CenterEvents events={events} timeZone={timeZone} centerId={campus.id} />
        </section>
      )}

      {/* (4) Service times: the weekly rhythm, beside what a first visit is like */}
      <section id="times" className="bt-section-tight" style={events.length > 0 ? undefined : { paddingTop: "clamp(48px, 7vw, 80px)" }}>
        <div className="bt-section-head bt-reveal">
          <div>
            <div className="bt-eyebrow">Service times</div>
            <h2 className="bt-h2">{virtual ? "Meet with us online" : "Gather with us"}</h2>
            <p className="bt-sec-sub">{virtual ? "Every gathering is online, so you can join from wherever you are." : "Come as you are. Here is when " + campus.name + " meets through the week."}</p>
          </div>
        </div>
        {serviceTimes.length > 0 ? (
          <ServiceRhythm times={serviceTimes} timeZone={timeZone} aside={firstVisitCard} />
        ) : (
          <div className="bt-two">
            <div className="bt-card bt-reveal" style={{ padding: 26, display: "grid", gap: 14 }}>
              <span style={{ color: "var(--bt-gold)" }}><IconClock size={26} /></span>
              <p>{extras?.timesNote || "Send the team a note for service times and they’ll help you plan a visit."}</p>
              <div><a className="bt-btn bt-btn-outline" href="#visit">Ask about service times</a></div>
            </div>
            {firstVisitCard}
          </div>
        )}
      </section>

      {/* (5) Find us: the map and every way to reach the center */}
      <section className="bt-band">
        <div className="bt-section-tight">
          <div className="bt-section-head bt-reveal">
            <div><div className="bt-eyebrow">{virtual ? "Stay connected" : "Find us"}</div><h2 className="bt-h2">{virtual ? "Get in touch" : "Where we meet"}</h2></div>
          </div>
          <div className={showMap ? "bt-find" : "bt-two"}>
            {showMap && (
              <div className="bt-find-map bt-reveal">
                <CenterMap campus={{ id: campus.id, slug: campus.slug || null, name: campus.name, lat: campus.latitude as number, lng: campus.longitude as number, address: place, serviceTimesLabel: timesSummary(serviceTimes), country: extras?.country || "", flag: extras?.flag || "", photo: cover, leaders: pastor || null, phone: phone || null, email: email || null }} />
              </div>
            )}
            <div className="bt-card bt-find-card bt-reveal" style={{ ["--d" as any]: 1 }}>
              {!virtual && place && (
                <div>
                  <div className="bt-eyebrow" style={{ marginBottom: 8 }}>Address</div>
                  <address style={{ fontStyle: "normal", color: "var(--bt-ink)", fontWeight: 500 }}>{campus.address1}{campus.address1 && <br />}{cityLine}</address>
                  <a className="bt-link" style={{ marginTop: 10 }} href={directionsUrl} target="_blank" rel="noopener noreferrer" {...trackAttrs("church_directions_clicked", { ...churchProps, placement: "find_us" })}>Get directions <IconArrowRight size={15} /></a>
                </div>
              )}
              {(phone || email || website) && (
                <div>
                  <div className="bt-eyebrow" style={{ marginBottom: 10 }}>Contact</div>
                  <div className="bt-contacts">
                    {phone && <a href={"tel:" + phone.replace(/[^+\d]/g, "")} {...trackAttrs("church_contact_clicked", { ...churchProps, method: "phone" })}><IconPhone size={17} /> {phone}</a>}
                    {email && <a href={"mailto:" + email} {...trackAttrs("church_contact_clicked", { ...churchProps, method: "email" })}><IconMail size={17} /> {email}</a>}
                    {website && <a href={website} target="_blank" rel="noopener noreferrer" {...trackAttrs(virtual ? "online_church_joined" : "church_contact_clicked", { ...churchProps, method: "website", placement: "contacts" })}><IconGlobe size={17} /> {website.replace(/^https?:\/\/(www\.)?/, "")}</a>}
                  </div>
                </div>
              )}
              <SocialLinks facebookUrl={facebookUrl} instagramUrl={instagramUrl} youtubeUrl={youtubeUrl} extraLinks={extraLinks} />
            </div>
          </div>
        </div>
      </section>

      {/* (6) Latest message + giving */}
      <section className="bt-section-tight">
        <div className="bt-two">
          {sermon && (
            <div className="bt-reveal">
              <div className="bt-eyebrow" style={{ marginBottom: 12 }}>{ownChannel ? "The latest message" : "The latest from " + BT.ministry}</div>
              <MessageCard sermon={sermon} feature placement="center_page" churchId={campus.id} />
            </div>
          )}
          <div className="bt-give bt-dark bt-reveal" style={{ ["--d" as any]: 1 }}>
            <span style={{ color: "var(--bt-gold-bright)" }}><IconGift size={26} /></span>
            <h2 className="bt-h3">Give to {campus.name}</h2>
            <p className="bt-muted-text">Your giving supports the ministry of {campus.name} and carries the Word further. Once or every month.</p>
            <div style={{ position: "relative", zIndex: 1 }}><Link className="bt-btn" href={"/give?center=" + encodeURIComponent(campus.slug || "") + "#give-now"}>Give</Link></div>
          </div>
        </div>
      </section>

      {/* (7) The center's past messages from its own channel */}
      {ownChannel && pastSermons.length > 0 && (
        <section className="bt-section-tight bt-reveal">
          <div className="bt-section-head">
            <div><div className="bt-eyebrow">Past services</div><h2 className="bt-h2">Recent messages from {campus.name}</h2></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px" }}>
              <Link className="bt-link" href={"/watch/" + campus.slug}>Watch page <IconArrowRight size={15} /></Link>
              <a className="bt-link" href={ownChannel.channelUrl + "/streams"} target="_blank" rel="noopener noreferrer"><IconYouTube size={15} /> Full archive on YouTube</a>
            </div>
          </div>
          <MessageLibrary sermons={pastSermons} placement="center_page_library" churchId={campus.id} />
        </section>
      )}

      {/* (8) A word from the pastor (when the center has written one) */}
      {pastorNote && (
        <section className="bt-section-tight">
          <figure className="bt-card bt-quote bt-reveal" style={{ margin: 0 }}>
            <span className="bt-quote-mark" aria-hidden>&ldquo;</span>
            <div>
              <div className="bt-eyebrow" style={{ marginBottom: 12 }}>A word from the pastor</div>
              <p>{pastorNote}</p>
              {pastor && <cite>{pastor}</cite>}
            </div>
          </figure>
        </section>
      )}

      {/* (9) Photos (when the admin has uploaded more than the cover) */}
      {photos.length > 1 && (
        <section className="bt-section-tight bt-reveal">
          <div className="bt-section-head"><div><div className="bt-eyebrow">Photos</div><h2 className="bt-h2">Life at {campus.name}</h2></div></div>
          <PhotoGallery photos={photos} name={campus.name} />
        </section>
      )}

      {leaders.length > 0 && (
        <section className="bt-section-tight bt-reveal">
          <LeadershipGrid leaders={leaders} featuredBio={pastorNote} />
        </section>
      )}

      {/* (10) Plan a visit + prayer, straight to this center's inbox */}
      <section id="visit" className="bt-band" style={{ scrollMarginTop: 72 }}>
        <div className="bt-section-tight">
          <div className="bt-section-head bt-reveal">
            <div>
              <div className="bt-eyebrow">No account needed</div>
              <h2 className="bt-h2">{virtual ? "Say hello" : "Plan your visit"}</h2>
            </div>
          </div>
          <div className="bt-two bt-reveal">
            <NextStepForm
              churchId={churchId}
              centers={thisCenter}
              type={virtual ? "contact" : "visit"}
              cta={virtual ? "Send message" : "Plan my visit"}
              messageLabel={virtual ? "Your message" : "Anything we should know? (optional)"}
              messageRequired={virtual}
              defaultMessage="I'm planning a visit."
              thankYouTitle={virtual ? "Thank you" : "We'll see you soon"}
              thankYouCopy={virtual ? "We've received your message." : "Someone will be looking out for you."}
            />
            <NextStepForm
              churchId={churchId}
              centers={thisCenter}
              type="prayer"
              cta="Send my prayer request"
              messageLabel="Your prayer request or praise report"
              messageRequired
              defaultMessage=""
              thankYouTitle="We're praying with you"
              thankYouCopy="Our prayer team has your request and is lifting it up."
            />
          </div>
        </div>
      </section>
    </BtShell>
  );
}
