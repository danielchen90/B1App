// Per-worship-center detail page — /locations/[campusSlug].
//
// An RSC that resolves the campus by slug off the anonymous campus list (unknown slug →
// notFound; renamed-alias 301 path stays wired for when the API exposes aliases), loads
// the four anonymous public reads in parallel, merges the resolved campusContent with
// the in-repo enrichment map (service times / contacts / socials from the ministry's
// published site), and renders in the locked order: hero → visit info → latest sermon →
// leadership → events → give → forms.
//
// PATH NOTE: the "MembershipApi" base already ends in "/membership" — client paths never
// re-prefix it. The sermon read is on "ContentApi".

import React, { cache } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ApiHelper } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import type { PublicCampus } from "@/helpers/PublicCampusHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { CampusHero } from "@/components/public-bt/CampusHero";
import { ServiceTimes } from "@/components/public-bt/ServiceTimes";
import { SocialLinks } from "@/components/public-bt/SocialLinks";
import { GiveButton } from "@/components/public-bt/GiveButton";
import { LeadershipGrid, type PublicLeader } from "@/components/public-bt/LeadershipGrid";
import { SermonBlock, type LatestSermon } from "@/components/public-bt/SermonBlock";
import { EventsList, type PublicEvent } from "@/components/public-bt/EventsList";
import { PrayerForm } from "@/components/public-bt/forms/PrayerForm";
import { ContactForm } from "@/components/public-bt/forms/ContactForm";
import { BT, getCampusExtras } from "@/components/public-bt/btSiteContent";
import { IconPhone, IconMail, IconGlobe } from "@/components/public-bt/BtIcons";
import {
  type CampusContent,
  type ServiceTime,
  type ExtraLink,
  HIDDEN
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

const loadEvents = cache(async (churchId: string, campusId: string): Promise<PublicEvent[]> => {
  if (!churchId || !campusId) return [];
  try {
    const data = await ApiHelper.getAnonymous(
      "/public/" + churchId + "/" + campusId + "/events",
      "MembershipApi"
    );
    return Array.isArray(data) ? (data as PublicEvent[]) : [];
  } catch {
    return [];
  }
});

const loadLatestSermon = cache(async (channel: string | undefined | null): Promise<LatestSermon | null> => {
  if (!channel) return null;
  try {
    const data = await ApiHelper.getAnonymous("/sermons/public/latest/" + channel, "ContentApi");
    return data && typeof data === "object" && (data as any).videoId ? (data as LatestSermon) : null;
  } catch {
    return null;
  }
});

// HIDDEN-aware readers: treat the explicit-hide sentinel as absent.
const str = (v: string | typeof HIDDEN | undefined): string => (v && v !== HIDDEN ? v : "");
const list = <T,>(v: T[] | typeof HIDDEN | undefined): T[] => (Array.isArray(v) ? v : []);

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug, campusSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const resolved = await resolveCampusBySlug(churchId, campusSlug);
  const churchName = config.church?.name || BT.name;

  if (!resolved) return MetaHelper.getMetaData(churchName, churchName, churchName, config.appearance);

  const campus = resolved.campus;
  const content = await loadCampusContent(churchId, campus.id);
  const title = campus.name + " — " + churchName;
  const locality = [campus.city, campus.state].filter(Boolean).join(", ");
  const description =
    str(content.welcomeNote) ||
    ("Visit the " + campus.name + " worship center" + (locality ? " in " + locality : "") +
      ". Service times, directions, the latest message, and how to plan your visit.");
  return MetaHelper.getMetaData(title, description, description, config.appearance);
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

  const content = await loadCampusContent(churchId, campus.id);
  const [leaders, events, allCampuses] = await Promise.all([
    loadLeadership(churchId),
    loadEvents(churchId, campus.id),
    loadVisibleCampuses(churchId)
  ]);
  const sermon = await loadLatestSermon(str(content.sermonYoutubeChannel) || BT.youtubeChannelId);

  const navLinks = toLocationLinks(allCampuses);
  // Give: campus override (API) → in-repo extras → the org's link. Give is core; always present.
  const giveUrl = str(content.givingUrl) || extras?.givingUrl || BT.giveUrl;

  // Service times: API content first, extras as fallback.
  const apiTimes = list<ServiceTime>(content.serviceTimes);
  const serviceTimes: ServiceTime[] = apiTimes.length > 0 ? apiTimes : (extras?.serviceTimes || []);
  const extraLinks: ExtraLink[] = list<ExtraLink>(content.extraLinks);

  const phone = extras?.phone;
  const email = extras?.email;
  const website = extras?.websiteUrl;

  return (
    <BtShell config={config} campuses={navLinks} giveUrl={giveUrl}>
      {/* (1) Hero — above the fold. */}
      <CampusHero
        campusName={campus.name}
        churchName={config.church?.name || BT.shortName}
        heroImage={str(content.heroImage) || null}
        welcomeNote={str(content.welcomeNote)}
        pastorNote={str(content.pastorNote)}
        flag={extras?.flag}
        country={extras?.country}
        leaders={extras?.leaders}
        giveUrl={giveUrl}
        sermonChannel={str(content.sermonYoutubeChannel) || null}
        streamKey={config.church?.subDomain || null}
      />

      {/* (2) Visit info — crawlable text; always shows. */}
      <section id="visit" className="bt-section">
        <ServiceTimes
          campusName={campus.name}
          serviceTimes={serviceTimes}
          address1={extras?.virtual ? "Online — join from anywhere" : campus.address1}
          city={extras?.virtual ? null : campus.city}
          state={extras?.virtual ? null : campus.state}
          zip={extras?.virtual ? null : campus.zip}
        />
        {(phone || email || website) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 28px", marginTop: 28, paddingTop: 22, borderTop: "1px solid var(--bt-line)" }}>
            {phone && (
              <a href={"tel:" + phone.replace(/[^+\d]/g, "")} className="bt-muted-text" style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                <span style={{ color: "var(--bt-gold-deep)", display: "inline-flex" }}><IconPhone size={17} /></span>{phone}
              </a>
            )}
            {email && (
              <a href={"mailto:" + email} className="bt-muted-text" style={{ display: "inline-flex", alignItems: "center", gap: 9, wordBreak: "break-all" }}>
                <span style={{ color: "var(--bt-gold-deep)", display: "inline-flex" }}><IconMail size={17} /></span>{email}
              </a>
            )}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="bt-muted-text" style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                <span style={{ color: "var(--bt-gold-deep)", display: "inline-flex" }}><IconGlobe size={17} /></span>{website.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            )}
          </div>
        )}
      </section>

      {/* (3) Latest sermon — hides silently when null. */}
      {sermon && (
        <section id="sermon" style={{ background: "#F3EDDD", borderTop: "1px solid var(--bt-line)", borderBottom: "1px solid var(--bt-line)" }}>
          <div className="bt-section">
            <SermonBlock sermon={sermon} />
          </div>
        </section>
      )}

      {/* (4) Leadership — hides when empty. */}
      {leaders.length > 0 && (
        <section id="leadership" className="bt-section">
          <LeadershipGrid leaders={leaders} featuredBio={str(content.pastorNote) || str(content.welcomeNote)} />
        </section>
      )}

      {/* (5) Upcoming events — hides silently when empty. */}
      {events.length > 0 && (
        <section id="events" style={{ background: "#F3EDDD", borderTop: "1px solid var(--bt-line)", borderBottom: "1px solid var(--bt-line)" }}>
          <div className="bt-section">
            <EventsList events={events} />
          </div>
        </section>
      )}

      {/* (6) Give — always shows. */}
      <section id="give" className="bt-dark">
        <div className="bt-section" style={{ textAlign: "center" }}>
          <div className="bt-eyebrow" style={{ justifyContent: "center" }}>Sow Into the Work</div>
          <h2 className="bt-h2" style={{ marginTop: 14, marginBottom: 12 }}>Give</h2>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 520, margin: "0 auto 26px" }}>
            Your giving supports the ministry of{" "}{campus.name}{" "}and carries the Word further.
          </p>
          <GiveButton givingUrl={giveUrl} variant="section" />
          <div style={{ marginTop: 40 }}>
            <SocialLinks
              facebookUrl={str(content.facebookUrl) || extras?.facebookUrl || null}
              instagramUrl={str(content.instagramUrl) || extras?.instagramUrl || null}
              youtubeUrl={str(content.youtubeUrl) || extras?.youtubeUrl || null}
              extraLinks={extraLinks}
            />
          </div>
        </div>
      </section>

      {/* (7) Prayer + Contact forms — tagged to THIS campus. */}
      <section id="connect" className="bt-section">
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div className="bt-eyebrow" style={{ justifyContent: "center" }}>No Account Needed</div>
          <h2 className="bt-h2" style={{ marginTop: 14 }}>Get in Touch</h2>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 560, margin: "14px auto 0" }}>
            Share a prayer request or send the{" "}{campus.name}{" "}team a message.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "start" }}>
          <PrayerForm churchId={churchId} campusId={campus.id} />
          <ContactForm churchId={churchId} campusId={campus.id} />
        </div>
      </section>
    </BtShell>
  );
}
