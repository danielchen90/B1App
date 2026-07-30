// Server helper that builds the SSR props for the public campus locator (Phase 20, Plan 06).
//
// Joins the anonymous campus LIST (20-01: name + stored lat/lng + address — the campus row)
// with each campus's resolved public CONTENT (20-03/05: serviceTimes live in campusContent,
// NOT the campus row — RESEARCH Pitfall 2). It NEVER geocodes: the lat/lng come straight from
// the stored campus row so the map island renders from props with no runtime address lookup.
//
// Only campuses with BOTH a real slug AND stored coordinates become map markers (a campus
// missing lat/lng can't be plotted). The crawlable list still lists every campus via the
// same DTO, so nothing is lost for SEO.
//
// PATH NOTE (matching PublicCampusHelper): the "MembershipApi" base already ends in
// "/membership", so the content path is "/campusContent/public/:churchId/:campusId".

import { ApiHelper } from "@churchapps/apphelper";
import { cache } from "react";
import { loadPublicCampuses, type PublicCampus } from "./PublicCampusHelper";

export interface LocatorCampus {
  id: string;
  slug: string | null;
  name: string;
  lat: number;
  lng: number;
  address: string;
  serviceTimesLabel: string;
}

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

/** A short "Sun 9:00 AM · Wed 7:00 PM" style label from resolved serviceTimes. */
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
 * Build the locator SSR props for a church: every plottable campus (real slug + stored
 * lat/lng) with its address and a short service-times label. Cached per-request so the
 * page + generateMetadata share one pass. Never throws — a failed content read just yields
 * an empty service-times label for that campus.
 */
export const loadLocatorCampuses = cache(async (churchId: string): Promise<LocatorCampus[]> => {
  if (!churchId) return [];
  const campuses = await loadPublicCampuses(churchId);

  const plottable = campuses.filter(
    (c) => c.slug && typeof c.latitude === "number" && typeof c.longitude === "number"
  );

  const built = await Promise.all(
    plottable.map(async (c): Promise<LocatorCampus> => {
      const content = await loadCampusContent(churchId, c.id);
      // serviceTimes is either the array, absent, or the HIDDEN sentinel string — Array.isArray
      // narrows to the real list and excludes the sentinel/absent cases in one check.
      const times: ServiceTime[] = Array.isArray(content.serviceTimes) ? content.serviceTimes : [];
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        lat: c.latitude as number,
        lng: c.longitude as number,
        address: formatAddress(c),
        serviceTimesLabel: formatServiceTimes(times)
      };
    })
  );

  return built;
});
