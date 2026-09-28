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
import { btSeo } from "@/components/public-bt/btSeo";
import { loadLocatorCampuses } from "@/helpers/LocatorCampusHelper";
import { loadBtConfig, loadVisibleCampuses, toLocationLinks } from "../btPageData";
import { BtShell } from "@/components/public-bt/BtShell";
import { CampusLocator } from "@/components/public-bt/CampusLocator";
import { BtPageHead } from "@/components/public-bt/BtPageHead";
import { BT, BT_NATION_COUNT } from "@/components/public-bt/btSiteContent";

type PageParams = { sdSlug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { sdSlug } = await params;
  const config = await loadBtConfig(sdSlug);
  const churchName = config.church?.name || BT.name;
  const title = "Locations | " + churchName;
  const description =
    "Here are all BTI locations. Find the " + churchName + " worship center nearest you across " + BT_NATION_COUNT +
    " nations in the United States, the Caribbean, and Canada. Service times, directions, and contacts for every center.";
  return btSeo(MetaHelper.getMetaData(title, description, description, config.appearance), "/locations");
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
      <BtPageHead
        eyebrow="Locations"
        title="Find your worship center"
        lede={`${locatorCampuses.filter((c) => !c.virtual).length} worship centers across ${BT_NATION_COUNT} nations, and an Online Church that gathers from anywhere. Share your location and the list puts the nearest first.`}
      />

      {/* The locator */}
      <section className="bt-section-tight">
        <CampusLocator campuses={locatorCampuses} mapHeight={660} />
      </section>
    </BtShell>
  );
}
