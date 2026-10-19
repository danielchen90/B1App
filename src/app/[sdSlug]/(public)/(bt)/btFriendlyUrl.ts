// Friendly center addresses on the Bible Teachers site: bibleteachers.com/ftl opens
// /locations/fort-lauderdale. Each center's address is set on its Website tab in Huro
// (campusContent.friendlyUrl, kept unique by the Api); a center's own slug works too
// (bibleteachers.com/atlanta). Resolved in the top-level [pageSlug] route, before the
// CMS page lookup, and only for the BT tenant.

import { cache } from "react";
import { loadAllCampusContent } from "@/helpers/LocatorCampusHelper";
import { loadBtConfig, loadVisibleCampuses } from "./btPageData";
import { isBtPublicSite } from "./isBtSite";

const ADDRESS_RE = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;

/** The center slug a first path segment stands for, or null when it is not a center's address. */
export const centerSlugForAddress = cache(async (sdSlug: string, segment: string): Promise<string | null> => {
  if (!isBtPublicSite(sdSlug)) return null;
  const wanted = decodeURIComponent(segment || "").toLowerCase();
  if (!ADDRESS_RE.test(wanted)) return null;
  const config = await loadBtConfig(sdSlug);
  const churchId = config.church?.id;
  if (!churchId) return null;
  const campuses = (await loadVisibleCampuses(churchId)).filter((c) => !!c.slug);
  const contents = (await loadAllCampusContent(churchId)) || {};
  const byFriendly = campuses.find((c) => (contents[c.id]?.friendlyUrl || "").toLowerCase() === wanted);
  if (byFriendly) return byFriendly.slug as string;
  const bySlug = campuses.find((c) => (c.slug || "").toLowerCase() === wanted);
  return bySlug ? (bySlug.slug as string) : null;
});
