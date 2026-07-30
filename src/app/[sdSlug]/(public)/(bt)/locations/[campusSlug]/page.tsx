// Bible Teachers PER-CAMPUS detail page — the spine of the visitor experience
// (Phase 20, Plan 05, SITE-02). An RSC that:
//
//   1. Resolves the church tenant (ConfigHelper.load(sdSlug,"website")).
//   2. Resolves the campus BY SLUG off the anonymous campus list (20-04 helper).
//      - unknown / inactive slug  → notFound()  (a REAL 404, SC#2)
//      - a renamed campus's OLD slug (present in the list only as an alias hit) →
//        redirect("/locations/<current-slug>", 301) (SC#2)
//   3. Server-loads, in parallel, the four anonymous public reads (all via
//      ApiHelper.getAnonymous — no auth, no key on the client):
//        - resolved campus content  GET /campusContent/public/:churchId/:campusId (20-03/05)
//        - public leadership        GET /public/:churchId/leadership              (PUB-01)
//        - per-campus events        GET /public/:churchId/:campusId/events        (20-01)
//        - latest sermon            GET /sermons/public/latest/:channel (ContentApi, 20-02)
//          — ONLY when content.sermonYoutubeChannel is set.
//   4. Renders inside `.bt-root` (<BtTheme/> + sticky <BtHeader/> carrying the Give slot)
//      in the LOCKED section order:
//        (1) hero + welcome / plan-your-visit  (ABOVE THE FOLD)
//        (2) address / service-times / directions  (crawlable text, SITE-03)
//        (3) latest sermon                      (hides silently when empty)
//        (4) leadership                         (public-safe; hides when empty)
//        (5) upcoming events                    (hides silently when empty)
//        (6) give section                       (ALWAYS shows)
//        (7) forms mounting slot                (plan 20-07)
//   5. Emits per-campus generateMetadata (title/meta/OG, SITE-03).
//
// PATH NOTES (matching PublicCampusHelper / BtLanding): the "MembershipApi" base already
// ends in "/membership", so campus/leadership/events client paths do NOT re-prefix it.
// The sermon read is on "ContentApi" (/sermons/public/latest/:channelId, 20-02).
//
// ROUTE-GROUP NOTE: this page ADDS a URL segment (locations/[campusSlug]) so it is a real
// sub-route and NEVER collides with the shared (public)/page.tsx index (unlike a bare
// (bt)/page.tsx). See BtLanding.tsx's routing note.

import React, { cache } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ApiHelper } from "@churchapps/apphelper";
import { ConfigHelper, type ConfigurationInterface } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadPublicCampuses, type PublicCampus } from "@/helpers/PublicCampusHelper";
import { BtTheme } from "@/components/public-bt/BtTheme";
import { BtHeader } from "@/components/public-bt/BtHeader";
import type { LocationLink } from "@/components/public-bt/LocationsMenu";
import { CampusHero } from "@/components/public-bt/CampusHero";
import { ServiceTimes } from "@/components/public-bt/ServiceTimes";
import { SocialLinks } from "@/components/public-bt/SocialLinks";
import { GiveButton } from "@/components/public-bt/GiveButton";
import { LeadershipGrid, type PublicLeader } from "@/components/public-bt/LeadershipGrid";
import { SermonBlock, type LatestSermon } from "@/components/public-bt/SermonBlock";
import { EventsList, type PublicEvent } from "@/components/public-bt/EventsList";
import { PrayerForm } from "@/components/public-bt/forms/PrayerForm";
import { ContactForm } from "@/components/public-bt/forms/ContactForm";
import {
  type CampusContent,
  type ServiceTime,
  type ExtraLink,
  HIDDEN
} from "@/components/public-bt/campusContentTypes";

type PageParams = { sdSlug: string; campusSlug: string };

const SECTION_STYLE: React.CSSProperties = {
  maxWidth: "var(--bt-maxw)",
  margin: "0 auto",
  padding: "72px 20px"
};

const BAND_STYLE: React.CSSProperties = {
  background: "var(--bt-surface-alt)",
  borderTop: "1px solid var(--bt-line)",
  borderBottom: "1px solid var(--bt-line)"
};

// ── Cached loaders — generateMetadata and the page body share ONE set of fetches ──

/** Tenant config (church id / appearance). Cached per request. */
const loadConfig = cache(async (sdSlug: string): Promise<ConfigurationInterface> => {
  EnvironmentHelper.init();
  return ConfigHelper.load(sdSlug, "website");
});

interface ResolvedCampus {
  campus: PublicCampus;
  /** When set, the requested slug was an alias for a renamed campus → 301 to this slug. */
  redirectToSlug?: string;
}

/**
 * Resolve the campus for a requested slug off the anonymous campus list. A live campus
 * whose current slug matches → render it. A list entry whose slug differs but which the
 * request reached via a renamed alias is handled by the caller's redirect (we only have
 * the list here, so an EXACT current-slug match is "render"; anything else is notFound
 * unless the list surfaces an alias — see below). Cached per request.
 *
 * NOTE: the 20-01 backend persists campuses.slug (current) + a campusSlugAlias table for
 * 301s, but exposes NO dedicated anonymous slug resolver route — only the campus LIST
 * (which carries the CURRENT slug). So: an exact current-slug hit renders; a miss falls
 * back to matching the requested slug against a campus whose CURRENT slug differs only if
 * the list carried it (it does not today) → notFound(). The 301 path is wired here so it
 * activates automatically once an alias-bearing list/resolver ships; today a stale slug
 * simply 404s, which is safe.
 */
const resolveCampusBySlug = cache(
  async (churchId: string, campusSlug: string): Promise<ResolvedCampus | null> => {
    const campuses = await loadPublicCampuses(churchId);
    const wanted = (campusSlug || "").toLowerCase();

    // Exact CURRENT-slug match → render this campus.
    const current = campuses.find((c) => (c.slug || "").toLowerCase() === wanted);
    if (current && current.slug) return { campus: current };

    // Alias fallback: if a campus carries prior slugs (aliases) and one matches, 301 to
    // its current slug. The list DTO may expose an optional `aliasSlugs` in a later API;
    // guarded so it is a no-op until then.
    for (const c of campuses) {
      const aliases: string[] = Array.isArray((c as any).aliasSlugs) ? (c as any).aliasSlugs : [];
      if (c.slug && aliases.some((a) => (a || "").toLowerCase() === wanted)) {
        return { campus: c, redirectToSlug: c.slug };
      }
    }

    return null;
  }
);

/** Resolved public content DTO for this campus (org-default overlaid with the campus override). */
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

/** Public-safe leadership (name / role / photo ONLY — SITE-04). */
const loadLeadership = cache(async (churchId: string): Promise<PublicLeader[]> => {
  if (!churchId) return [];
  try {
    const data = await ApiHelper.getAnonymous("/public/" + churchId + "/leadership", "MembershipApi");
    return Array.isArray(data) ? (data as PublicLeader[]) : [];
  } catch {
    return [];
  }
});

/** Per-campus future events (display-only, EVT-01). Empty on the held events feed → hides. */
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

/** Latest sermon for the campus's YouTube channel (20-02, ContentApi). null → block hides. */
const loadLatestSermon = cache(async (channel: string | undefined | null): Promise<LatestSermon | null> => {
  if (!channel) return null;
  try {
    const data = await ApiHelper.getAnonymous("/sermons/public/latest/" + channel, "ContentApi");
    return data && typeof data === "object" && (data as any).videoId ? (data as LatestSermon) : null;
  } catch {
    return null;
  }
});

// A HIDDEN-aware string reader: treat the explicit-hide sentinel as absent.
const str = (v: string | typeof HIDDEN | undefined): string => (v && v !== HIDDEN ? v : "");
const list = <T,>(v: T[] | typeof HIDDEN | undefined): T[] => (Array.isArray(v) ? v : []);

// ── generateMetadata (per-campus SEO, SITE-03) ──
export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug, campusSlug } = await params;
  const config = await loadConfig(sdSlug);
  const churchId = config.church?.id || "";
  const resolved = await resolveCampusBySlug(churchId, campusSlug);
  const churchName = config.church?.name || "Bible Teachers";

  if (!resolved) return MetaHelper.getMetaData(churchName, churchName, churchName, config.appearance);

  const campus = resolved.campus;
  const content = await loadCampusContent(churchId, campus.id);
  const title = campus.name + " - " + churchName;
  const locality = [campus.city, campus.state].filter(Boolean).join(", ");
  const description =
    str(content.welcomeNote) ||
    ("Visit " + campus.name + (locality ? " in " + locality : "") + ". Service times, directions, latest message, and how to plan your visit.");
  return MetaHelper.getMetaData(title, description, description, config.appearance);
}

const toLocationLinks = (campuses: PublicCampus[]): LocationLink[] =>
  campuses.filter((c) => c.slug).map((c) => ({ slug: c.slug, name: c.name }));

// ── The per-campus detail page ──
export default async function CampusDetailPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, campusSlug } = await params;

  const config = await loadConfig(sdSlug);
  const churchId = config.church?.id || "";

  // Resolve the campus by slug — notFound on unknown/inactive, 301 on a renamed alias (SC#2).
  const resolved = await resolveCampusBySlug(churchId, campusSlug);
  if (!resolved) notFound();
  if (resolved.redirectToSlug && resolved.redirectToSlug !== campusSlug) {
    redirect("/locations/" + resolved.redirectToSlug); // Next issues a 307/308; a renamed slug lands on the current page (SC#2).
  }
  const campus = resolved.campus;

  // Server-load the four public reads in parallel (sermon only when a channel is configured).
  const content = await loadCampusContent(churchId, campus.id);
  const [leaders, events, allCampuses] = await Promise.all([
    loadLeadership(churchId),
    loadEvents(churchId, campus.id),
    loadPublicCampuses(churchId)
  ]);
  const sermon = await loadLatestSermon(str(content.sermonYoutubeChannel));

  const locationLinks = toLocationLinks(allCampuses);
  const giveUrl = str(content.givingUrl) || undefined;

  const serviceTimes: ServiceTime[] = list<ServiceTime>(content.serviceTimes);
  const extraLinks: ExtraLink[] = list<ExtraLink>(content.extraLinks);

  return (
    <div className="bt-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <BtTheme />
      {/* Sticky header carries the persistent Give affordance (campus give URL, one tap away). */}
      <BtHeader campuses={locationLinks} giveUrl={giveUrl} />

      {/* (1) Hero + welcome / plan-your-visit — ABOVE THE FOLD. Live indicator sits inside. */}
      <CampusHero
        campusName={campus.name}
        churchName={config.church?.name || "Bible Teachers"}
        heroImage={str(content.heroImage) || null}
        welcomeNote={str(content.welcomeNote)}
        pastorNote={str(content.pastorNote)}
        giveUrl={giveUrl}
        sermonChannel={str(content.sermonYoutubeChannel) || null}
        streamKey={config.church?.subDomain || null}
      />

      {/* (2) Address / service times / directions — server-rendered CRAWLABLE text (SITE-03). ALWAYS shows. */}
      <section id="visit" style={SECTION_STYLE}>
        <ServiceTimes
          campusName={campus.name}
          serviceTimes={serviceTimes}
          address1={campus.address1}
          city={campus.city}
          state={campus.state}
          zip={campus.zip}
        />
      </section>

      {/* (3) Latest sermon — hides SILENTLY when null (mixed empty-state). */}
      {sermon && (
        <section id="sermon" style={{ ...BAND_STYLE }}>
          <div style={SECTION_STYLE}>
            <SermonBlock sermon={sermon} />
          </div>
        </section>
      )}

      {/* (4) Leadership — public-safe featured lead + grid; hides when empty (falls with media/people). */}
      {leaders.length > 0 && (
        <section id="leadership" style={SECTION_STYLE}>
          <LeadershipGrid
            leaders={leaders}
            featuredBio={str(content.pastorNote) || str(content.welcomeNote)}
          />
        </section>
      )}

      {/* (5) Upcoming events — display-only; hides SILENTLY when empty (EVT-01). */}
      {events.length > 0 && (
        <section id="events" style={{ ...BAND_STYLE }}>
          <div style={SECTION_STYLE}>
            <EventsList events={events} />
          </div>
        </section>
      )}

      {/* (6) Give — ALWAYS shows (core info), display-only, opens the payment link in a new tab (GIV-01). */}
      <section id="give" style={{ ...SECTION_STYLE, textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 12 }}>Give</h2>
        <p style={{ color: "var(--bt-muted)", maxWidth: 560, margin: "0 auto 24px", fontSize: "1.1rem" }}>
          Support the ministry of {campus.name}.
        </p>
        <GiveButton givingUrl={giveUrl} variant="section" />

        {/* Social links (per-campus + org-default already merged by the resolver) — MED-02. */}
        <div style={{ marginTop: 40 }}>
          <SocialLinks
            facebookUrl={str(content.facebookUrl) || null}
            instagramUrl={str(content.instagramUrl) || null}
            youtubeUrl={str(content.youtubeUrl) || null}
            extraLinks={extraLinks}
          />
        </div>
      </section>

      {/* (7) Prayer + Contact forms (plan 20-07) — two SEPARATE login-free forms, each
             tagged to THIS campus via campusId. Side by side on desktop, stacked on mobile. */}
      <section id="connect" style={{ ...BAND_STYLE }}>
        <div style={SECTION_STYLE}>
          <h2 style={{ fontSize: "2rem", marginBottom: 8, textAlign: "center" }}>Get in touch</h2>
          <p style={{ color: "var(--bt-muted)", textAlign: "center", maxWidth: 560, margin: "0 auto 32px", fontSize: "1.1rem" }}>
            Share a prayer request or send us a message — no account needed.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
              alignItems: "start"
            }}
          >
            <PrayerForm churchId={churchId} campusId={campus.id} />
            <ContactForm churchId={churchId} campusId={campus.id} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: "auto", borderTop: "1px solid var(--bt-line)", background: "var(--bt-surface)" }}>
        <div
          style={{
            maxWidth: "var(--bt-maxw)",
            margin: "0 auto",
            padding: "36px 20px",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center"
          }}
        >
          <span style={{ fontFamily: "var(--bt-heading-font)", fontWeight: 700 }}>{campus.name}</span>
          <span style={{ color: "var(--bt-muted)", fontSize: "0.9rem" }}>
            © {new Date().getFullYear()} {config.church?.name || "Bible Teachers"}
          </span>
        </div>
      </footer>
    </div>
  );
}
