// Server helper for the anonymous public campus list (Phase 20, Plan 04).
//
// Wraps the 20-01 MembershipApi endpoint (server controller `@controller("/membership/public")`,
// route `/:churchId/campuses`) — an actionWrapperAnon read that projects every row
// through the toPublicCampus whitelist (never a raw campus row) — in React `cache()`,
// so generateMetadata and the page body share ONE fetch per request. Consumed by the
// BT landing page and the sitemap enumerator.
//
// PATH NOTE: the ApiHelper "MembershipApi" base URL ALREADY ends in "/membership"
// (CommonEnvironmentHelper: `MembershipApi = base + "/membership"`), exactly like the
// existing `/churches/lookup` and `/settings/public/` calls. So the client path is
// "/public/:churchId/campuses" (NOT "/membership/public/...", which would double the
// segment and 404). Reached URL = <base>/membership/public/:churchId/campuses.

import { ApiHelper } from "@churchapps/apphelper";
import { cache } from "react";

// Mirror of the API's PublicCampusDTO (forks/Api .../PublicDto.ts). Address keys
// are the intentional public exception (a campus is a public physical location);
// there is NEVER a churchId / importKey / person key here.
export interface PublicCampus {
  id: string;
  slug: string | null;
  name: string;
  latitude: number | null;
  longitude: number | null;
  address1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

/**
 * Load the anonymous public campus list for a church. Cached per-request so the
 * page + its generateMetadata (+ any sibling caller) resolve to a single fetch.
 * Never throws to the caller — an older API deploy (404) or a transient failure
 * resolves to [] so the landing degrades gracefully (campuses section hides).
 */
export const loadPublicCampuses = cache(async (churchId: string): Promise<PublicCampus[]> => {
  if (!churchId) return [];
  try {
    const data = await ApiHelper.getAnonymous(
      "/public/" + churchId + "/campuses",
      "MembershipApi"
    );
    return Array.isArray(data) ? (data as PublicCampus[]) : [];
  } catch {
    return [];
  }
});
