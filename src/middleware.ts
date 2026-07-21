import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
const isInternalOrSubdomainHost = (host: string): boolean =>
  host === "localhost" ||
  host.startsWith("localhost:") ||
  host.startsWith("127.0.0.1") ||
  host.endsWith(".huro.church") ||
  host.endsWith(".up.railway.app") ||
  host.endsWith(".localtest.me") ||
  host.endsWith(".localhost");

const membershipLookupBase = (): string | null => {
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
  const lookupBase = membershipLookupBase();
  if (!lookupBase) return NextResponse.next(); // no API base configured → fail safe

  let subDomain: string | undefined;
  try {
    const res = await fetch(`${lookupBase}/${encodeURIComponent(apex)}`);
    if (res.ok) {
      const data = (await res.json()) as { subDomain?: string } | null;
      subDomain = data?.subDomain || undefined;
    }
  } catch {
    // Network/API error → fall through; never crash the request.
    return NextResponse.next();
  }

  // Unknown custom domain / no match → fall through to the default/not-found.
  if (!subDomain) return NextResponse.next();

  // Match → rewrite to the SAME /{sdSlug}{path}{search} shape the static
  // rewrites produce, so [sdSlug] routing + ConfigHelper.load(subDomain) work.
  const { pathname, search } = request.nextUrl;
  return NextResponse.rewrite(new URL(`/${subDomain}${pathname}${search}`, request.url));
}

// Only run on page routes; skip Next internals, the API, the manifest/sw, and
// anything with a file extension (static assets).
export const config = {
  matcher: ["/((?!_next/|api/|manifest\\.json|manifest\\.webmanifest|sw\\.js|.*\\.[\\w]+$).*)"]
};
