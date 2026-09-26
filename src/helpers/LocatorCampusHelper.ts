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
import { firstPhoto, contentText } from "@/components/public-bt/campusContentTypes";

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
 * Every center's resolved content in one call (GET .../campusContent/public/:churchId/all,
 * added in the 2026-09 redesign). Resolves to null when the API predates it, so the
 * per-campus reads above take over.
 */
const loadAllCampusContent = cache(async (churchId: string): Promise<Record<string, any> | null> => {
  try {
    const data = await ApiHelper.getAnonymous("/campusContent/public/" + churchId + "/all", "MembershipApi");
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, any>) : null;
  } catch {
    return null;
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
  // Trust the bulk answer only when it is keyed by real campus ids: an API that predates
  // the /all route matches it as /:churchId/:campusId="all" and returns a plain object.
  const rawBulk = await loadAllCampusContent(churchId);
  const bulk = rawBulk && visible.some((c) => Object.prototype.hasOwnProperty.call(rawBulk, c.id)) ? rawBulk : null;

  const built = await Promise.all(
    visible.map(async (c): Promise<LocatorCampus> => {
      const content = bulk ? (bulk[c.id] || {}) : await loadCampusContent(churchId, c.id);
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
        virtual: extras?.virtual,
        photo: firstPhoto(content),
        leaders: contentText(content.leaders) || extras?.leaders || null,
        phone: contentText(content.phone) || extras?.phone || null,
        email: contentText(content.email) || extras?.email || null
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
