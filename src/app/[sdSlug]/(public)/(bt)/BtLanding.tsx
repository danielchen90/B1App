// Bible Teachers public LANDING page — org-brochure RSC (Phase 20, Plan 04).
//
// BRAND IS HARDCODED THIS PHASE: black/white/gold via <BtTheme/>, scoped to `.bt-root`
// (never leaks to the Huro admin navy/gold). churchId-scoping stays underneath in the
// data layer; only the LOOK is hardcoded. Generalized, data-driven per-tenant theming
// is DEFERRED to Phase 21.
//
// ROUTING NOTE: this is a COMPONENT, not a `page.tsx`. A `(bt)/page.tsx` would resolve
// to the same `/[sdSlug]` index route as the existing CMS `(public)/page.tsx` and cause
// a hard Next "two parallel pages resolve to the same path" build error (a route group
// in parentheses adds NO URL segment). Per the phase RESEARCH ("page.tsx EXISTS — CMS
// home; new BT landing ... replaces render for BT churchId"), the shared index page
// delegates its render to <BtLanding/> for the BT public tenant. The `(bt)` route group
// still hosts the real sub-routes (locations/[campusSlug], plan 20-05) which DO add
// segments and so never collide.
//
// Brochure section order (LOCKED): hero → Mission → latest-sermon placeholder → About
// → PROMINENT Campuses section → Social → footer. Campuses are ONE prominent section
// among several — NOT a bare hero, NOT a pure find-a-campus hub.

import React from "react";
import type { Metadata } from "next";
import { cache } from "react";
import { ApiHelper } from "@churchapps/apphelper";
import type { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadPublicCampuses, type PublicCampus } from "@/helpers/PublicCampusHelper";
import { BtTheme } from "@/components/public-bt/BtTheme";
import { BtHeader } from "@/components/public-bt/BtHeader";
import { BtBrand } from "@/components/public-bt/BtBrand";
import type { LocationLink } from "@/components/public-bt/LocationsMenu";

// The org-default resolved content field-set (mirror of the API's CampusContentFields,
// resolved-for-org via GET .../campusContent/public/:churchId). Every field optional.
interface BtOrgContent {
  mission?: string;
  about?: string;
  welcomeNote?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  givingUrl?: string;
  sermonYoutubeChannel?: string;
}

/**
 * Load the org-default resolved public content (mission/about/social/give). Cached
 * per-request. PATH NOTE: like the campus list, the "MembershipApi" base already ends
 * in "/membership", so the client path is "/campusContent/public/:churchId" (controller
 * is @controller("/membership/campusContent"), route "/public/:churchId"). Degrades to
 * {} on an older API deploy (404) so the landing still renders.
 */
const loadBtOrgContent = cache(async (churchId: string): Promise<BtOrgContent> => {
  if (!churchId) return {};
  try {
    const data = await ApiHelper.getAnonymous("/campusContent/public/" + churchId, "MembershipApi");
    return (data && typeof data === "object") ? (data as BtOrgContent) : {};
  } catch {
    return {};
  }
});

/** Shared per-request loader — the page + generateMetadata resolve to ONE set of fetches. */
export const loadBtLandingData = cache(async (config: ConfigurationInterface) => {
  const churchId = config.church?.id || "";
  const [campuses, content] = await Promise.all([
    loadPublicCampuses(churchId),
    loadBtOrgContent(churchId)
  ]);
  return { churchId, campuses, content };
});

/** SEO title/meta/OG for the BT landing (SITE-03). Reuses the cached loaders. */
export async function buildBtMetadata(config: ConfigurationInterface): Promise<Metadata> {
  const churchName = config.church?.name || "Bible Teachers";
  const { content } = await loadBtLandingData(config);
  const description = content.mission || content.about
    || (churchName + " — find a campus near you, watch the latest message, and plan your visit.");
  return MetaHelper.getMetaData(churchName, description, description, config.appearance);
}

const toLocationLinks = (campuses: PublicCampus[]): LocationLink[] =>
  campuses.map((c) => ({ slug: c.slug, name: c.name }));

const SECTION_STYLE: React.CSSProperties = {
  maxWidth: "var(--bt-maxw)",
  margin: "0 auto",
  padding: "72px 20px"
};

/**
 * The BT-branded org-brochure landing. Renders inside `.bt-root` with <BtTheme/> +
 * <BtHeader/>. Consumes the SSR campus list + org content.
 */
export const BtLanding: React.FC<{ config: ConfigurationInterface }> = async ({ config }) => {
  const { campuses, content } = await loadBtLandingData(config);
  const locationLinks = toLocationLinks(campuses);
  const linkableCampuses = campuses.filter((c) => c.slug);

  return (
    <div className="bt-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <BtTheme />
      <BtHeader campuses={locationLinks} giveUrl={content.givingUrl} />

      {/* ── Full-bleed hero ── */}
      <section style={{ background: "var(--bt-surface-alt)", borderBottom: "1px solid var(--bt-line)" }}>
        <div style={{ ...SECTION_STYLE, textAlign: "center", padding: "104px 20px" }}>
          <div style={{ marginBottom: 20 }}>
            <BtBrand size="lg" />
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", fontWeight: 800, maxWidth: 820, margin: "0 auto" }}>
            Teaching the Word. Reaching the region.
          </h1>
          <p style={{ color: "var(--bt-muted)", fontSize: "1.2rem", maxWidth: 640, margin: "20px auto 32px" }}>
            {content.welcomeNote || "Find a campus near you, watch the latest message, and plan your visit."}
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a className="bt-btn" href="#campuses">Find a Campus</a>
            {content.givingUrl && (
              <a className="bt-btn bt-btn-outline" href={content.givingUrl} target="_blank" rel="noopener noreferrer">Give</a>
            )}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      {content.mission && (
        <section id="about" style={SECTION_STYLE}>
          <h2 style={{ fontSize: "2rem", marginBottom: 16 }}>Our Mission</h2>
          <p style={{ fontSize: "1.15rem", color: "var(--bt-muted)", maxWidth: 760, lineHeight: 1.65 }}>
            {content.mission}
          </p>
        </section>
      )}

      {/* ── Latest sermon placeholder (real media island lands in plan 20-06) ── */}
      <section id="sermons" style={{ ...SECTION_STYLE, background: "var(--bt-surface-alt)", maxWidth: "none" }}>
        <div style={{ maxWidth: "var(--bt-maxw)", margin: "0 auto", padding: "0 20px" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: 16 }}>Latest Message</h2>
          <div
            style={{
              border: "1px solid var(--bt-line)",
              borderRadius: "var(--bt-radius-lg)",
              background: "var(--bt-surface)",
              padding: "56px 24px",
              textAlign: "center",
              color: "var(--bt-muted)"
            }}
          >
            {/* Latest-sermon media block (plan 20-06 wires the YouTube-uploads helper here) */}
            Latest message coming soon.
          </div>
        </div>
      </section>

      {/* ── About ── */}
      {content.about && (
        <section style={SECTION_STYLE}>
          <h2 style={{ fontSize: "2rem", marginBottom: 16 }}>About Us</h2>
          <p style={{ fontSize: "1.15rem", color: "var(--bt-muted)", maxWidth: 760, lineHeight: 1.65 }}>
            {content.about}
          </p>
        </section>
      )}

      {/* ── PROMINENT Campuses section (discoverable path #2: lower list/map) ── */}
      <section id="campuses" style={{ ...SECTION_STYLE, background: "var(--bt-surface-alt)", maxWidth: "none" }}>
        <div style={{ maxWidth: "var(--bt-maxw)", margin: "0 auto", padding: "0 20px" }}>
          <h2 style={{ fontSize: "2.2rem", marginBottom: 8 }}>Our Campuses</h2>
          <p style={{ color: "var(--bt-muted)", marginBottom: 28, fontSize: "1.1rem" }}>
            Find a Bible Teachers campus near you.
          </p>

          {/* LocatorMap island (plan 20-06) */}

          {linkableCampuses.length === 0 ? (
            <p style={{ color: "var(--bt-muted)" }}>Campus locations are coming soon.</p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 16
              }}
            >
              {linkableCampuses.map((c) => (
                <li key={c.id}>
                  <a
                    href={`/locations/${c.slug}`}
                    style={{
                      display: "block",
                      height: "100%",
                      border: "1px solid var(--bt-line)",
                      borderRadius: "var(--bt-radius)",
                      background: "var(--bt-surface)",
                      padding: "20px 22px"
                    }}
                  >
                    <div style={{ fontFamily: "var(--bt-heading-font)", fontWeight: 700, fontSize: "1.2rem", marginBottom: 6 }}>
                      {c.name}
                    </div>
                    {(c.address1 || c.city) && (
                      <div style={{ color: "var(--bt-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                        {c.address1}
                        {c.address1 && (c.city || c.state) ? <br /> : null}
                        {[c.city, c.state].filter(Boolean).join(", ")} {c.zip || ""}
                      </div>
                    )}
                    <div style={{ marginTop: 14, color: "var(--bt-gold-strong)", fontWeight: 600 }}>
                      Visit this campus →
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Social ── */}
      {(content.facebookUrl || content.instagramUrl || content.youtubeUrl) && (
        <section id="connect" style={{ ...SECTION_STYLE, textAlign: "center" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: 20 }}>Connect With Us</h2>
          <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
            {content.facebookUrl && <a className="bt-btn bt-btn-outline" href={content.facebookUrl} target="_blank" rel="noopener noreferrer">Facebook</a>}
            {content.instagramUrl && <a className="bt-btn bt-btn-outline" href={content.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>}
            {content.youtubeUrl && <a className="bt-btn bt-btn-outline" href={content.youtubeUrl} target="_blank" rel="noopener noreferrer">YouTube</a>}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer style={{ marginTop: "auto", borderTop: "1px solid var(--bt-line)", background: "var(--bt-surface)" }}>
        <div style={{ maxWidth: "var(--bt-maxw)", margin: "0 auto", padding: "36px 20px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <BtBrand size="sm" />
          <span style={{ color: "var(--bt-muted)", fontSize: "0.9rem" }}>
            © {new Date().getFullYear()} {config.church?.name || "Bible Teachers"}
          </span>
        </div>
      </footer>
    </div>
  );
};
