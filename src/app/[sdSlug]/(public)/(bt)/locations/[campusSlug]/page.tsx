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
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApiHelper } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { btSeo } from "@/components/public-bt/btSeo";
import type { PublicCampus } from "@/helpers/PublicCampusHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { SocialLinks } from "@/components/public-bt/SocialLinks";
import { LeadershipGrid, type PublicLeader } from "@/components/public-bt/LeadershipGrid";
import { LiveIndicator } from "@/components/public-bt/LiveIndicator";
import { MessageCard } from "@/components/public-bt/MessageCard";
import { EventCards } from "@/components/public-bt/EventCards";
import { PhotoGallery } from "@/components/public-bt/PhotoGallery";
import { MakeMyCenter } from "@/components/public-bt/CenterActions";
import { NextStepForm } from "@/components/public-bt/forms/NextStepForm";
import { loadSermonFeed } from "@/helpers/SermonFeedHelper";
import { loadPublicEvents } from "@/helpers/PublicEventsHelper";
import { BT, BT_COPY, getCampusExtras } from "@/components/public-bt/btSiteContent";
import { IconPhone, IconMail, IconGlobe, IconPin, IconClock, IconUser, IconArrowRight, IconGift } from "@/components/public-bt/BtIcons";
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

// HIDDEN-aware readers: treat the explicit-hide sentinel as absent.
const str = (v: string | typeof HIDDEN | undefined): string => (v && v !== HIDDEN ? v : "");
const list = <T,>(v: T[] | typeof HIDDEN | undefined): T[] => (Array.isArray(v) ? v : []);

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug, campusSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";
  const resolved = await resolveCampusBySlug(churchId, campusSlug);
  const churchName = config.church?.name || BT.name;

  if (!resolved) return { ...MetaHelper.getMetaData("Worship center not found | " + churchName, churchName, churchName, config.appearance), robots: { index: false } };

  const campus = resolved.campus;
  const content = await loadCampusContent(churchId, campus.id);
  const title = campus.name + " | " + churchName;
  const locality = [campus.city, campus.state].filter(Boolean).join(", ");
  const description =
    str(content.welcomeNote) ||
    ("Visit the " + campus.name.replace(/^the\s+/i, "") + " worship center" + (locality ? " in " + locality : "") +
      ". Service times, directions, the latest message, and how to plan your visit.");
  return btSeo(MetaHelper.getMetaData(title, description, description, config.appearance), "/locations/" + (campus.slug || campusSlug));
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
  const channel = str(content.sermonYoutubeChannel) || BT.youtubeChannelId;
  const [leaders, events, allCampuses, sermons] = await Promise.all([
    loadLeadership(churchId),
    loadPublicEvents(churchId, campus.id),
    loadVisibleCampuses(churchId),
    loadSermonFeed(channel, 1)
  ]);
  const sermon = sermons[0];

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
  const welcome = str(content.welcomeNote) ||
    (virtual
      ? BT_COPY.onlineBlurb
      : "Welcome home. Whoever you are and wherever you're from, there's a seat for you at " + campus.name + ". Come and be taught of the Lord.");
  const firstVisit = str(content.whatToExpect) || BT_COPY.whatToExpect;

  const cityLine = [campus.city, campus.state].filter(Boolean).join(", ") + (campus.zip ? " " + campus.zip : "");
  const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent([campus.address1, campus.city, campus.state, campus.zip].filter(Boolean).join(", ") || campus.name);
  const thisCenter = [{ id: campus.id, slug: campus.slug, name: campus.name, virtual }];

  const CSS = `
.bt-ch { border-bottom: 1px solid var(--bt-line); background: var(--bt-ivory); }
.bt-ch-in { max-width: var(--bt-maxw); margin: 0 auto; padding: clamp(28px, 5vw, 56px) 20px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: clamp(24px, 4vw, 56px); align-items: center; }
.bt-ch-photo { aspect-ratio: 4 / 3; border-radius: var(--bt-radius-lg); background: var(--bt-sunk) center / cover no-repeat; box-shadow: var(--bt-shadow); }
.bt-ch-facts { display: grid; gap: 10px; margin-top: 18px; }
.bt-ch-facts div { display: flex; gap: 10px; align-items: flex-start; color: var(--bt-body); }
.bt-ch-facts svg { margin-top: 3px; color: var(--bt-gold); }
.bt-visit { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
.bt-visit .bt-card { padding: 24px; display: grid; gap: 12px; align-content: start; }
.bt-times { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.bt-times li { display: flex; justify-content: space-between; gap: 14px; border-bottom: 1px solid var(--bt-line); padding-bottom: 10px; }
.bt-times li b { color: var(--bt-ink); font-weight: 600; }
.bt-contacts { display: grid; gap: 8px; }
.bt-contacts a { display: inline-flex; align-items: center; gap: 8px; color: var(--bt-body); word-break: break-all; }
.bt-contacts a:hover { color: var(--bt-ink); }
.bt-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 22px; align-items: start; }
@media (max-width: 860px) { .bt-ch-in { grid-template-columns: 1fr; } .bt-ch-photo { order: -1; } }
`;

  return (
    <BtShell config={config} campuses={navLinks} giveUrl={giveUrl}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* (1) Hero: the center's own photo, name, pastor, times, and what to do next */}
      <section className="bt-ch">
        <div className="bt-ch-in">
          <div>
            <div style={{ minHeight: 28, marginBottom: 4 }}><LiveIndicator streamKey={config.church?.subDomain || null} /></div>
            <div className="bt-eyebrow">{(extras?.flag ? extras.flag + " " : "") + (virtual ? "Online Church" : (extras?.country || "Worship center"))}</div>
            <h1 className="bt-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", marginTop: 10 }}>{campus.name}</h1>
            <p className="bt-lede" style={{ marginTop: 12 }}>{welcome}</p>
            <div className="bt-ch-facts">
              {pastor && <div><IconUser size={17} /><span>{pastor}</span></div>}
              {serviceTimes.length > 0 && (
                <div><IconClock size={17} /><span>{serviceTimes.slice(0, 3).map((t) => t.day + " " + t.time).join(" · ")}</span></div>
              )}
              {virtual
                ? <div><IconGlobe size={17} /><span>Join from anywhere in the world</span></div>
                : (campus.address1 || cityLine.trim()) && <div><IconPin size={17} /><span>{[campus.address1, cityLine.trim()].filter(Boolean).join(", ")}</span></div>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
              {virtual
                ? (website ? <a className="bt-btn" href={website} target="_blank" rel="noopener noreferrer">Join the Online Church</a> : <a className="bt-btn" href="#visit">Join us</a>)
                : <a className="bt-btn" href="#visit">Plan your visit</a>}
              {!virtual && <a className="bt-btn bt-btn-outline" href={directionsUrl} target="_blank" rel="noopener noreferrer"><IconPin size={17} /> Directions</a>}
              {campus.slug && <MakeMyCenter slug={campus.slug} name={campus.name} />}
            </div>
          </div>
          <div className="bt-ch-photo" role="img" aria-label={campus.name + " worship center"} style={{ backgroundImage: "url('" + cover + "')" }} />
        </div>
      </section>

      {/* (2) Visiting: times, first visit, contacts */}
      <section className="bt-section-tight">
        <div className="bt-visit">
          <div className="bt-card">
            <div className="bt-eyebrow">Service times</div>
            {serviceTimes.length > 0 ? (
              <ul className="bt-times">
                {serviceTimes.map((t, i) => (
                  <li key={i}><b>{t.day}</b><span>{t.time}{t.label ? " · " + t.label : ""}</span></li>
                ))}
              </ul>
            ) : (
              <p>Send the team a note for service times and they&rsquo;ll help you plan a visit.</p>
            )}
          </div>
          <div className="bt-card">
            <div className="bt-eyebrow">{virtual ? "Joining online" : "Your first visit"}</div>
            <p style={{ whiteSpace: "pre-line" }}>{firstVisit}</p>
          </div>
          <div className="bt-card">
            <div className="bt-eyebrow">Get in touch</div>
            <div className="bt-contacts">
              {!virtual && (campus.address1 || cityLine.trim()) && (
                <address style={{ fontStyle: "normal" }}>{campus.address1}{campus.address1 && <br />}{cityLine}</address>
              )}
              {phone && <a href={"tel:" + phone.replace(/[^+\d]/g, "")}><IconPhone size={16} /> {phone}</a>}
              {email && <a href={"mailto:" + email}><IconMail size={16} /> {email}</a>}
              {website && <a href={website} target="_blank" rel="noopener noreferrer"><IconGlobe size={16} /> {website.replace(/^https?:\/\/(www\.)?/, "")}</a>}
            </div>
            <SocialLinks
              facebookUrl={str(content.facebookUrl) || extras?.facebookUrl || null}
              instagramUrl={str(content.instagramUrl) || extras?.instagramUrl || null}
              youtubeUrl={str(content.youtubeUrl) || extras?.youtubeUrl || null}
              extraLinks={extraLinks}
            />
          </div>
        </div>
      </section>

      {/* (3) Photos (when the admin has uploaded more than the cover) */}
      {photos.length > 1 && (
        <section className="bt-section-tight">
          <div className="bt-section-head"><div><div className="bt-eyebrow">Photos</div><h2 className="bt-h2">Life at {campus.name}</h2></div></div>
          <PhotoGallery photos={photos} name={campus.name} />
        </section>
      )}

      {/* (4) Upcoming events at this center (and network events) */}
      {events.length > 0 && (
        <section className="bt-band">
          <div className="bt-section-tight">
            <div className="bt-section-head">
              <div><div className="bt-eyebrow">Coming up</div><h2 className="bt-h2">Events</h2></div>
              <Link className="bt-link" href="/events">All events <IconArrowRight size={15} /></Link>
            </div>
            <EventCards events={events} limit={6} />
          </div>
        </section>
      )}

      {/* (5) Latest message + leadership */}
      <section className="bt-section-tight">
        <div className="bt-two">
          {sermon && (
            <div>
              <div className="bt-eyebrow" style={{ marginBottom: 12 }}>The latest message</div>
              <MessageCard sermon={sermon} feature />
            </div>
          )}
          <div className="bt-card" style={{ padding: 26, display: "grid", gap: 12, alignContent: "start" }}>
            <span style={{ color: "var(--bt-gold)" }}><IconGift size={24} /></span>
            <h2 className="bt-h3">Give to {campus.name}</h2>
            <p>Your giving supports the ministry of {campus.name} and carries the Word further. Once or every month.</p>
            <div><Link className="bt-btn" href={"/give?center=" + encodeURIComponent(campus.slug || "") + "#give-now"}>Give</Link></div>
          </div>
        </div>
      </section>

      {leaders.length > 0 && (
        <section className="bt-section-tight">
          <LeadershipGrid leaders={leaders} featuredBio={str(content.pastorNote)} />
        </section>
      )}

      {/* (6) Plan a visit + prayer, straight to this center's inbox */}
      <section id="visit" className="bt-band" style={{ scrollMarginTop: 72 }}>
        <div className="bt-section-tight">
          <div className="bt-section-head">
            <div>
              <div className="bt-eyebrow">No account needed</div>
              <h2 className="bt-h2">{virtual ? "Say hello" : "Plan your visit"}</h2>
            </div>
          </div>
          <div className="bt-two">
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
