// Bible Teachers hosts: decide in the middleware whether a path is a page that does not exist.
//
// Why: in Next 16 a notFound() thrown while a dynamic page renders sends the 404 status with an
// empty "<html id="__next_error__">" shell (no lang, no h1, no links); the not-found page is only
// drawn in the browser. A path that matches no route at all renders the root not-found.tsx
// on the server instead. So the middleware sends the known-missing paths (an unknown center,
// event or top-level page) to an address no route matches, and visitors and crawlers get the
// branded 404 in the server HTML with a real 404 status.
//
// Fail open: any API error or unexpected shape means "not missing", and the page decides as before.

import { isHiddenCampusSlug } from "@/components/public-bt/btSiteContent";

/** A path no route matches (with or without the tenant prefix), so the root not-found renders. */
export const BT_MISSING_REWRITE = "/_bt/_missing/_page/_404";

// First path segments that are real routes (directories under src/app, src/app/[sdSlug] and
// its (public) and (bt) groups), plus the stock built-in [pageSlug] pages.
const KNOWN_FIRST_SEGMENTS = new Set([
  // src/app
  "privacy",
  "terms",
  "cookies",
  "localhost",
  "socialsuggestions",
  "api",
  // src/app/[sdSlug]
  "mobile",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
  // (public)
  "groups",
  "guest-register",
  "login",
  "logout",
  "register",
  "stream",
  "volunteer",
  // (bt)
  "about",
  "bt-home",
  "connect",
  "e",
  "events",
  "give",
  "locations",
  "my",
  "next-steps",
  "sermons",
  "watch",
  // [pageSlug] built-ins
  "votd",
  "bible",
  "donate"
]);

// Segments whose second level is decided by data (center slug or event slug).
const DATA_SECOND_SEGMENTS = new Set(["locations", "watch", "e"]);

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: unknown; until: number }>();

async function cachedJson<T>(url: string): Promise<T | undefined> {
  const hit = cache.get(url);
  if (hit && hit.until > Date.now()) return hit.value as T;
  const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) return undefined;
  const value = (await res.json()) as T;
  cache.set(url, { value, until: Date.now() + TTL_MS });
  return value;
}

async function churchId(apiBase: string, subDomain: string): Promise<string | undefined> {
  const church = await cachedJson<{ id?: string }>(`${apiBase}/membership/churches/lookup/?subDomain=${encodeURIComponent(subDomain)}`);
  return church?.id || undefined;
}

async function campusSlugs(apiBase: string, id: string): Promise<Set<string> | undefined> {
  const campuses = await cachedJson<{ slug?: string | null; aliasSlugs?: string[] }[]>(`${apiBase}/membership/public/${id}/campuses`);
  if (!Array.isArray(campuses)) return undefined;
  const slugs = new Set<string>();
  campuses.forEach((c) => {
    if (!c?.slug || isHiddenCampusSlug(c.slug)) return;
    slugs.add(c.slug.toLowerCase());
    if (Array.isArray(c.aliasSlugs)) c.aliasSlugs.forEach((a) => a && slugs.add(a.toLowerCase()));
  });
  return slugs;
}

async function cmsPageSlugs(apiBase: string, id: string): Promise<Set<string> | undefined> {
  const pages = await cachedJson<{ url?: string }[]>(`${apiBase}/content/pages/public/${id}`);
  if (!Array.isArray(pages)) return undefined;
  return new Set(pages.map((p) => (p?.url || "").replace(/^\/+/, "").split("/")[0].toLowerCase()).filter(Boolean));
}

async function eventExists(apiBase: string, slug: string): Promise<boolean> {
  const key = `${apiBase}/membership/crm/public/events/${encodeURIComponent(slug)}`;
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value as boolean;
  const res = await fetch(key, { signal: AbortSignal.timeout(2500) });
  // Only a definite 404 counts as missing; anything else lets the page decide.
  const exists = res.status !== 404;
  // Missing answers are kept briefly so a newly published event shows up within a minute.
  cache.set(key, { value: exists, until: Date.now() + (exists ? TTL_MS : 60 * 1000) });
  return exists;
}

/** True only when the path is certainly a page that does not exist on this Bible Teachers site. */
export async function isBtMissingPath(pathname: string, subDomain: string, apiBase: string): Promise<boolean> {
  try {
    const segments = pathname.split("/").filter(Boolean).map((s) => decodeURIComponent(s).toLowerCase());
    if (segments.length === 0 || segments.length > 2) return false;
    const [first, second] = segments;

    if (segments.length === 2) {
      if (DATA_SECOND_SEGMENTS.has(first)) {
        if (first === "e") return !(await eventExists(apiBase, second));
        const id = await churchId(apiBase, subDomain);
        if (!id) return false;
        const slugs = await campusSlugs(apiBase, id);
        return slugs ? !slugs.has(second) : false;
      }
      // Under any other first segment, [pageSlug]/[id] only renders the stock form page.
      return !(KNOWN_FIRST_SEGMENTS.has(first) || first === "forms");
    }

    if (KNOWN_FIRST_SEGMENTS.has(first)) return false;
    const id = await churchId(apiBase, subDomain);
    if (!id) return false;
    const cms = await cmsPageSlugs(apiBase, id);
    return cms ? !cms.has(first) : false;
  } catch {
    return false;
  }
}
