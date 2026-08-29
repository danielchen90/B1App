// Server helper that builds the SSR props for the public worship-center locator.
//
// Joins the anonymous campus LIST (name + stored lat/lng + address) with each campus's
// resolved public CONTENT (serviceTimes live in campusContent, not the campus row) and
// with the in-repo enrichment map (btSiteContent — country/flag/service-time fallbacks
// distilled from the ministry's published site). It NEVER geocodes: lat/lng come straight
// from the stored campus row.
//
// EVERY visible campus is returned (internal iso-demo rows are filtered out); ones
// without stored coordinates or marked virtual simply don't become map pins.
//
// PATH NOTE (matching PublicCampusHelper): the "MembershipApi" base already ends in
// "/membership", so the content path is "/campusContent/public/:churchId/:campusId".

import { ApiHelper } from "@churchapps/apphelper";
import { cache } from "react";
import { loadPublicCampuses, type PublicCampus } from "./PublicCampusHelper";
import { getCampusExtras, isHiddenCampusSlug, BT_COUNTRY_ORDER } from "@/components/public-bt/btSiteContent";
import type { LocatorCampus } from "@/components/public-bt/LeafletLocatorMap";

export type { LocatorCampus };

interface ServiceTime {
  day?: string;
  time?: string;
  label?: string;
}

/** One-line human address from the campus row (crawlable). */
function formatAddress(c: PublicCampus): string {
  const cityLine = [c.city, c.state].filter(Boolean).join(", ") + (c.zip ? " " + c.zip : "");
  return [c.address1, cityLine.trim()].filter(Boolean).join(", ");
}

/** A short "Sun 9:00 AM · Wed 7:00 PM" style label from serviceTimes. */
function formatServiceTimes(times: ServiceTime[]): string {
  return times
    .filter((s) => s && (s.day || s.time))
    .slice(0, 3)
    .map((s) => [s.day, s.time].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(" · ");
}

/** Resolved public content for one campus. Cached per-request; degrades to {} on any error. */
const loadCampusContent = cache(async (churchId: string, campusId: string): Promise<any> => {
  if (!churchId || !campusId) return {};
  try {
    const data = await ApiHelper.getAnonymous(
      "/campusContent/public/" + churchId + "/" + campusId,
      "MembershipApi"
    );
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
});

/**
 * Build the locator SSR props: every public worship center with address, country/flag,
 * and a short service-times label (API content first, in-repo extras as fallback).
 * Ordered by country (the fellowship's home regions first), then name. Never throws.
 */
export const loadLocatorCampuses = cache(async (churchId: string): Promise<LocatorCampus[]> => {
  if (!churchId) return [];
  const campuses = await loadPublicCampuses(churchId);
  const visible = campuses.filter((c) => !isHiddenCampusSlug(c.slug));

  const built = await Promise.all(
    visible.map(async (c): Promise<LocatorCampus> => {
      const content = await loadCampusContent(churchId, c.id);
      const extras = getCampusExtras(c.slug);
      // serviceTimes may be the array, absent, or the HIDDEN sentinel string — Array.isArray
      // narrows to the real list; the extras fill the gap when the API row is empty.
      const apiTimes: ServiceTime[] = Array.isArray(content.serviceTimes) ? content.serviceTimes : [];
      const times = apiTimes.length > 0 ? apiTimes : extras?.serviceTimes || [];
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        lat: typeof c.latitude === "number" ? c.latitude : null,
        lng: typeof c.longitude === "number" ? c.longitude : null,
        address: extras?.virtual ? "Join from anywhere in the world" : formatAddress(c),
        serviceTimesLabel: formatServiceTimes(times),
        country: extras?.country || "United States",
        flag: extras?.flag || "📍",
        virtual: extras?.virtual
      };
    })
  );

  const order = (country: string) => {
    const i = BT_COUNTRY_ORDER.indexOf(country);
    return i === -1 ? BT_COUNTRY_ORDER.length : i;
  };
  built.sort((a, b) => order(a.country) - order(b.country) || a.name.localeCompare(b.name));
  return built;
});
