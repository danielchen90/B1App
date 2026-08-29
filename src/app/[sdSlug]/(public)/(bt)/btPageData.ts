// Shared per-request loaders for the BT public pages — config + the public campus nav
// list, each wrapped in React cache() so a page body and its generateMetadata resolve
// to one set of fetches.

import { cache } from "react";
import { ConfigHelper, type ConfigurationInterface } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { loadPublicCampuses, type PublicCampus } from "@/helpers/PublicCampusHelper";
import { isHiddenCampusSlug } from "@/components/public-bt/btSiteContent";
import type { LocationLink } from "@/components/public-bt/LocationsMenu";

export const loadBtConfig = cache(async (sdSlug: string): Promise<ConfigurationInterface> => {
  EnvironmentHelper.init();
  return ConfigHelper.load(sdSlug, "website");
});

/** Public campuses minus internal test rows. */
export const loadVisibleCampuses = cache(async (churchId: string): Promise<PublicCampus[]> => {
  const campuses = await loadPublicCampuses(churchId);
  return campuses.filter((c) => !isHiddenCampusSlug(c.slug));
});

export const toLocationLinks = (campuses: PublicCampus[]): LocationLink[] =>
  campuses.filter((c) => c.slug).map((c) => ({ slug: c.slug, name: c.name }));
