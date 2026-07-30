// Bible Teachers public CAMPUS LOCATOR page — /locations (Phase 20, Plan 06, MAP-01..06).
//
// An RSC that resolves the church tenant, loads the plottable campus list joined with each
// campus's resolved service-times (LocatorCampusHelper — NEVER geocodes; stored lat/lng
// only), and renders the split list/map locator inside `.bt-root` with <BtTheme/> +
// <BtHeader/>. The <CampusLocator> mounts the client-only <LocatorMap> island via
// next/dynamic({ssr:false}); its child <CampusList> is server-rendered so the full address
// list is present as the crawlable / no-JS fallback even before the map hydrates.
//
// ROUTE-GROUP NOTE: this ADDS the /locations URL segment, so it is a real sub-route and
// never collides with the shared (public)/page.tsx index or the per-campus
// locations/[campusSlug]/page.tsx (which adds a further segment). See BtLanding routing note.
//
// PATH NOTE: like the sibling pages, "MembershipApi" already ends in "/membership", so the
// helper's client paths do NOT re-prefix it.

import React, { cache } from "react";
import type { Metadata } from "next";
import { ConfigHelper, type ConfigurationInterface } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadLocatorCampuses } from "@/helpers/LocatorCampusHelper";
import { loadPublicCampuses, type PublicCampus } from "@/helpers/PublicCampusHelper";
import { BtTheme } from "@/components/public-bt/BtTheme";
import { BtHeader } from "@/components/public-bt/BtHeader";
import type { LocationLink } from "@/components/public-bt/LocationsMenu";
import { CampusLocator } from "@/components/public-bt/CampusLocator";

type PageParams = { sdSlug: string };

// Cached tenant config — generateMetadata + the page body resolve to ONE load.
const loadConfig = cache(async (sdSlug: string): Promise<ConfigurationInterface> => {
  EnvironmentHelper.init();
  return ConfigHelper.load(sdSlug, "website");
});

const toLocationLinks = (campuses: PublicCampus[]): LocationLink[] =>
  campuses.filter((c) => c.slug).map((c) => ({ slug: c.slug, name: c.name }));

// ── generateMetadata (locator SEO — title/meta/OG, SITE-03) ──
export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadConfig(sdSlug);
  const churchName = config.church?.name || "Bible Teachers";
  const title = "Campus Locations - " + churchName;
  const description =
    "Find a " + churchName + " campus near you. Browse all locations on the map, see service times and addresses, and plan your visit.";
  return MetaHelper.getMetaData(title, description, description, config.appearance);
}

const SECTION_STYLE: React.CSSProperties = {
  maxWidth: "var(--bt-maxw)",
  margin: "0 auto",
  padding: "56px 20px"
};

export default async function LocationsPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;

  const config = await loadConfig(sdSlug);
  const churchId = config.church?.id || "";

  const [locatorCampuses, allCampuses] = await Promise.all([
    loadLocatorCampuses(churchId),
    loadPublicCampuses(churchId)
  ]);
  const locationLinks = toLocationLinks(allCampuses);

  return (
    <div className="bt-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <BtTheme />
      <BtHeader campuses={locationLinks} />

      {/* Header band */}
      <section style={{ background: "var(--bt-surface-alt)", borderBottom: "1px solid var(--bt-line)" }}>
        <div style={{ ...SECTION_STYLE, textAlign: "center", padding: "64px 20px" }}>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800 }}>Find a Campus</h1>
          <p style={{ color: "var(--bt-muted)", fontSize: "1.15rem", maxWidth: 620, margin: "16px auto 0" }}>
            Explore every {config.church?.name || "Bible Teachers"} campus on the map, or browse the list below and plan your visit.
          </p>
        </div>
      </section>

      {/* The split locator (list LEFT / map RIGHT desktop; list-first + Map toggle mobile).
          <CampusLocator> renders <CampusList> server-side as the crawlable fallback. */}
      <section style={SECTION_STYLE}>
        <CampusLocator campuses={locatorCampuses} />
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
          <span style={{ fontFamily: "var(--bt-heading-font)", fontWeight: 700 }}>
            {config.church?.name || "Bible Teachers"}
          </span>
          <span style={{ color: "var(--bt-muted)", fontSize: "0.9rem" }}>
            © {new Date().getFullYear()} {config.church?.name || "Bible Teachers"}
          </span>
        </div>
      </footer>
    </div>
  );
}
