// Worship-center locator — /locations.
//
// An RSC that loads every public worship center (stored lat/lng — never geocodes) joined
// with service times and nation metadata, then renders the proximity locator: a Leaflet
// map spanning the whole fellowship (US Gulf & East Coast through the Caribbean to
// Ontario) beside a sidebar that reorders nearest-first once the visitor shares their
// location. The list server-renders as the crawlable no-JS fallback.

import React from "react";
import type { Metadata } from "next";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { loadLocatorCampuses } from "@/helpers/LocatorCampusHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { CampusLocator } from "@/components/public-bt/CampusLocator";
import { BT, BT_NATION_COUNT } from "@/components/public-bt/btSiteContent";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchName = config.church?.name || BT.name;
  const title = "Locations — " + churchName;
  const description =
    "Find the " + churchName + " worship center nearest you — " + BT_NATION_COUNT +
    " nations across the United States, the Caribbean, and Canada. Service times, directions, and contacts for every center.";
  return MetaHelper.getMetaData(title, description, description, config.appearance);
}

export default async function LocationsPage({ params }: { params: Promise<PageParams> }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;

  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id || "";

  const [locatorCampuses, allCampuses] = await Promise.all([
    loadLocatorCampuses(churchId),
    loadVisibleCampuses(churchId)
  ]);
  const navLinks = toLocationLinks(allCampuses);

  return (
    <BtShell config={config} campuses={navLinks}>
      {/* Header band */}
      <section className="bt-dark" style={{ borderBottom: "1px solid var(--bt-line-dark)" }}>
        <div className="bt-section-tight" style={{ textAlign: "center", paddingTop: 64, paddingBottom: 56 }}>
          <div className="bt-eyebrow" style={{ justifyContent: "center" }}>{BT.commissionRef}</div>
          <h1 className="bt-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", marginTop: 16 }}>
            Find Your <em style={{ fontStyle: "italic", color: "var(--bt-gold-bright)" }}>Worship Center</em>
          </h1>
          <p className="bt-lede bt-muted-text" style={{ maxWidth: 620, margin: "18px auto 0" }}>
            {locatorCampuses.length}{" "}worship centers across{" "}{BT_NATION_COUNT}{" "}nations — and an
            online church that gathers from anywhere. The list orders itself by what&rsquo;s closest to you.
          </p>
        </div>
      </section>

      {/* The locator */}
      <section className="bt-section-tight">
        <CampusLocator campuses={locatorCampuses} mapHeight={660} />
      </section>
    </BtShell>
  );
}
