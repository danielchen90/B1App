import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isBtPublicSite } from "@/app/[sdSlug]/(public)/(bt)/isBtSite";

// Bible Teachers public site: leftover stock ChurchApps pages that are not part of the
// ministry's site stay reachable for members but out of search, and two old addresses move.
const BT_NOINDEX_PATHS = /^\/(groups|volunteer|guest-register|votd|bible|register)(\/|$)/i;
const BT_REDIRECTS: { test: RegExp; to: (host: string) => string }[] = [
  { test: /^\/donate\/?$/i, to: () => "https://marybanks.net/give" },
  { test: /^\/stream(\/.*)?$/i, to: (host) => `https://${host}/watch` },
  // The home page's internal route (next.config rewrites "/" to it); never its own address.
  { test: /^\/bt-home\/?$/i, to: (host) => `https://${host}/` }
];

/**
 * Custom-domain resolution middleware (Phase 19, TEN-01).
 *
 * PURPOSE: map an incoming *custom* domain (apex + www — e.g. bibleteachers.com)
 * to the owning church's `subDomain` and rewrite the request to the same
 * `/{sdSlug}/...` route the static `next.config.mjs` rewrites produce, so
 * `[sdSlug]` routing + `ConfigHelper.load(subDomain)` work with ZERO downstream
 * changes.
 *
 * SUBDOMAIN RESOLUTION IS UNCHANGED: any `*.huro.church` host (and localhost /
 * *.up.railway.app internal hosts) is a no-op passthrough here — the existing
 * `next.config.mjs` regex rewrites keep handling it exactly as before. This
 * middleware is purely ADDITIVE for non-huro custom domains (RESEARCH Pitfall 2:
 * a DB lookup cannot live in the static rewrite).
 *
 * API BASE: read from NEXT_PUBLIC_API_BASE — the single stable base URL B1App
 * already uses for every ChurchApps API. It MUST point at the stable
 * `.up.railway.app` host, never a Railway reference var and never the custom
 * domain (MEMORY: "Railway custom domains flip refs"; RESEARCH Pitfall 6). No
 * domain is hardcoded here.
 */

// Hosts that must fall through to the existing next.config.mjs rewrites untouched.
// This MUST catch every platform/infra host — especially Railway's healthcheck
// host (healthcheck.railway.app) and internal probes — so they never trigger the
// DB-lookup fetch below. Missing one adds cold-boot fetch latency on the "/"
// healthcheck path and can fail the deploy (replicas never healthy). A bare,
// dot-less host (internal probe) is treated as infra too.
const isInternalOrSubdomainHost = (host: string): boolean => {
  const h = host.split(":")[0]; // strip any :port
  return (
    !h.includes(".") ||               // bare hostname (internal probe) — no subdomain to resolve
    h === "localhost" ||
    h.startsWith("127.") ||
    h.endsWith(".huro.church") ||
    h.endsWith(".railway.app") ||     // *.up.railway.app AND healthcheck.railway.app
    h.endsWith(".railway.internal") ||
    h.endsWith(".localtest.me") ||
    h.endsWith(".localhost")
  );
};

const EVENTS_HOST = "events.marybanks.net";

// Custom domain -> church subdomain answers, kept in memory for a few minutes.
const DOMAIN_CACHE = new Map<string, { subDomain: string | undefined; until: number }>();
const DOMAIN_TTL_MS = 5 * 60 * 1000;
const DOMAIN_MISS_TTL_MS = 60 * 1000;

// Bible Teachers routes that depend on the visitor (sign-in, My Church, sign-out) are never shared-cached.
const BT_PRIVATE_PATHS = /^\/(my|login|logout|register|guest-register|mobile|admin|member)(\/|$)/i;

// The site moved from church.chensolutions.com to churches.marybanks.net (2026-10-13).
const MOVED_HOSTS: Record<string, string> = { "church.chensolutions.com": "churches.marybanks.net" };

const membershipLookupBase =(): string | null => {
  const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "");
  if (!base) return null;
  return `${base}/membership/domains/public/lookup`;
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // x-forwarded-host wins behind Caddy/Railway; fall back to the Host header.
  const rawHost = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").toLowerCase();
  const host = rawHost.split(",")[0].trim();

  // No host, or a huro.church subdomain / internal host → do nothing. The
  // static rewrites in next.config.mjs continue to resolve the subdomain.
  if (!host || isInternalOrSubdomainHost(host)) return NextResponse.next();

  // Custom domain: strip a leading "www." so www + apex resolve to one church.
  const apex = host.replace(/^www\./, "");

  // events.marybanks.net is the address HURO event emails use for /e/<slug>; it is the
  // same Bible Teachers site (a domains row maps it to the church), and its bare root
  // opens the events list instead of the church home page.
  const movedTo = MOVED_HOSTS[apex];
  if (movedTo) {
    return NextResponse.redirect(`https://${movedTo}${request.nextUrl.pathname}${request.nextUrl.search}`, 308);
  }

  if (apex === EVENTS_HOST && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(`https://${EVENTS_HOST}/events`, 308);
  }

  const lookupBase = membershipLookupBase();
  if (!lookupBase) return NextResponse.next(); // no API base configured → fail safe

  let subDomain: string | undefined;
  const cached = DOMAIN_CACHE.get(apex);
  if (cached && cached.until > Date.now()) {
    subDomain = cached.subDomain;
  } else {
    try {
      // Hard cap the lookup so a slow/unreachable Api can never hang a request
      // (this runs on the hot path for every non-huro host). Timeout → fail safe.
      const res = await fetch(`${lookupBase}/${encodeURIComponent(apex)}`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = (await res.json()) as { subDomain?: string } | null;
        subDomain = data?.subDomain || undefined;
        // Remember the answer (found or not) so page loads skip the round trip to the Api.
        DOMAIN_CACHE.set(apex, { subDomain, until: Date.now() + (subDomain ? DOMAIN_TTL_MS : DOMAIN_MISS_TTL_MS) });
      }
    } catch {
      // Network/API error → fall through; never crash the request.
      return NextResponse.next();
    }
  }

  // Unknown custom domain / no match → fall through to the default/not-found.
  if (!subDomain) return NextResponse.next();

  // Match → set the SAME x-site header an upstream proxy would, then pass through.
  // next.config.mjs already has x-site rewrite rules ABOVE its broad host rules, so
  // this maps the request to /{subDomain}{path} while taking PRIORITY over the host
  // rule — which would otherwise re-prepend the CUSTOM domain's own first label
  // (church.chensolutions.com -> /church/... -> 404). Rewriting the path here
  // directly does NOT work: the static host rewrite re-fires on the rewritten path.
  // Scoping that host rewrite instead breaks Railway's "/" healthcheck (proven by
  // deploy), so we reuse the existing x-site seam and leave next.config untouched.
  const bt = isBtPublicSite(subDomain);
  if (bt) {
    const path = request.nextUrl.pathname;
    const moved = BT_REDIRECTS.find((r) => r.test.test(path));
    if (moved) return NextResponse.redirect(moved.to(host), 308);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-site", `${subDomain}.huro.church`);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (bt && BT_NOINDEX_PATHS.test(request.nextUrl.pathname)) response.headers.set("X-Robots-Tag", "noindex, follow");
  // The public pages are the same for every visitor (no cookies or session are read on the
  // server; sign-in state is drawn in the browser), so shared caches may keep them briefly.
  if (bt && request.method === "GET" && !BT_PRIVATE_PATHS.test(request.nextUrl.pathname)) {
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  }
  return response;
}

// Only run on page routes; skip Next internals, the API, the manifest/sw, and
// anything with a file extension (static assets).
export const config = {
  // robots.txt and sitemap.xml are listed too so a custom domain gets its own church's.
  matcher: ["/((?!_next/|api/|manifest\\.json|manifest\\.webmanifest|sw\\.js|.*\\.[\\w]+$).*)", "/robots.txt", "/sitemap.xml"]
};
