// Mary Banks ID "signed in before the page shows" for the Bible Teachers public site.
//
// Someone signed in to another Mary Banks site holds a Mary Banks ID session this site
// cannot see. Before a public page is served to a visitor with no session here, the
// middleware sends them once through /api/auth/mbid/start?prompt=none: Mary Banks ID
// answers at once, either with a sign-in (they arrive signed in) or with "nobody is
// signed in" (they arrive as a guest). Nothing is ever shown to them on the way.
//
// Cookies:
// - mb_signed_in  shared by every marybanks.net site (Domain=marybanks.net): someone
//                 signed in to a Mary Banks ID in this browser. Set after every sign-in,
//                 cleared at sign-out and when a quiet check finds nobody signed in.
// - bt_sso_guard  60 seconds while a check is under way, so a check can never loop.
// - bt_sso_checked  a check already found nobody (30 days on marybanks.net, 30 minutes
//                 elsewhere, where the shared cookie cannot be seen).
//
// No Node imports here: the middleware imports this file.

import type { NextRequest, NextResponse } from "next/server";
import { memberSignInEnabled } from "@/lib/memberSignIn";

export const SIGNED_IN_HINT_COOKIE = "mb_signed_in";
export const SSO_GUARD_COOKIE = "bt_sso_guard";
export const SSO_CHECKED_COOKIE = "bt_sso_checked";
/** Display-only: the member's profile picture address (Google accounts). Not a credential. */
export const MEMBER_PICTURE_COOKIE = "bt_member_pic";

const HINT_MAX_AGE = 60 * 60 * 24 * 90;
const GUARD_MAX_AGE = 60;
/** After a quiet check that broke (not "nobody signed in"), wait this long before another. */
export const GUARD_AFTER_FAILURE_MAX_AGE = 30 * 60;
const CHECKED_MAX_AGE_SHARED = 60 * 60 * 24 * 30;
const CHECKED_MAX_AGE_OTHER = 30 * 60;
/** After sign-out the reader chose to be signed out here: no quiet check for a month. */
export const CHECKED_MAX_AGE_SIGNED_OUT = 60 * 60 * 24 * 30;

// Keycloak's answers to prompt=none when nobody is signed in. Not failures.
export const NOT_SIGNED_IN_ERRORS = new Set(["login_required", "interaction_required", "consent_required"]);

// Crawlers and link previewers get the page, never a bounce through Mary Banks ID
// (same list as the Faith Library storefront's lib/sso-check.ts).
const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|whatsapp|telegram|discord|skype|slack|twitterbot|linkedinbot|vercel-screenshot|lighthouse|headless|curl\/|wget\/|python-requests|go-http-client|httpclient/i;

// Sign-in, sign-out and church-admin paths, and the internal addresses behind pages.
const EXCLUDED_PATHS = /^\/(api|_next|_bt|login|logout|register|guest-register|mobile|admin|member|bt-home|robots\.txt|sitemap\.xml)(\/|$)/i;

const hostOnly = (host: string): string => host.split(",")[0].trim().split(":")[0].toLowerCase();

/** marybanks.net and its subdomains can see the shared hint cookie; other hosts cannot. */
export const isMaryBanksHost = (host: string): boolean => {
  const h = hostOnly(host);
  return h === "marybanks.net" || h.endsWith(".marybanks.net");
};

const secureFor = (host: string): boolean => {
  const h = hostOnly(host);
  return !(h === "localhost" || h.endsWith(".localhost") || h.startsWith("127."));
};

/** Mark this browser as signed in to a Mary Banks ID (marybanks.net hosts only). */
export const setSignedInHint = (res: NextResponse, host: string): void => {
  if (!isMaryBanksHost(host)) return;
  res.cookies.set(SIGNED_IN_HINT_COOKIE, "1", { domain: "marybanks.net", path: "/", maxAge: HINT_MAX_AGE, secure: true, httpOnly: true, sameSite: "lax" });
};

/** Forget the shared "signed in" hint (marybanks.net hosts only). */
export const clearSignedInHint = (res: NextResponse, host: string): void => {
  if (!isMaryBanksHost(host)) return;
  res.cookies.set(SIGNED_IN_HINT_COOKIE, "", { domain: "marybanks.net", path: "/", maxAge: 0, secure: true, httpOnly: true, sameSite: "lax" });
};

/** Remember that a check found nobody signed in, so the next pages load straight away. */
export const setChecked = (res: NextResponse, host: string, maxAge?: number): void => {
  res.cookies.set(SSO_CHECKED_COOKIE, "1", {
    path: "/",
    maxAge: maxAge ?? (isMaryBanksHost(host) ? CHECKED_MAX_AGE_SHARED : CHECKED_MAX_AGE_OTHER),
    secure: secureFor(host),
    httpOnly: true,
    sameSite: "lax"
  });
};

export const setGuard = (res: NextResponse, host: string, maxAge = GUARD_MAX_AGE): void => {
  res.cookies.set(SSO_GUARD_COOKIE, "1", { path: "/", maxAge, secure: secureFor(host), httpOnly: true, sameSite: "lax" });
};

/**
 * Whether this request should go through a quiet Mary Banks ID check before the page
 * is served. Only real, top-level page loads of a Bible Teachers public page, from a
 * browser (not a crawler, not the ministry phone apps), with member sign-in on and no
 * session here yet. Then either the shared hint says they are signed in somewhere, or
 * this browser has not been checked lately.
 */
export const shouldRunSilentCheck = (request: NextRequest): boolean => {
  if (!memberSignInEnabled() || !process.env.MBID_CLIENT_SECRET) return false;
  if (request.method !== "GET") return false;
  if (EXCLUDED_PATHS.test(request.nextUrl.pathname)) return false;

  // A navigation that renders a page. Next's client-side router fetches (RSC payloads,
  // prefetches) and frames are left alone.
  const h = request.headers;
  const dest = h.get("sec-fetch-dest");
  if (dest && dest !== "document") return false;
  if (!dest && !(h.get("accept") || "").includes("text/html")) return false;
  if (h.get("rsc") || h.get("next-router-prefetch") || h.get("next-router-state-tree") || h.get("purpose") === "prefetch" || h.get("sec-purpose")?.includes("prefetch")) return false;

  const ua = h.get("user-agent") || "";
  if (!ua || BOT_UA.test(ua)) return false;
  // The phone apps sign in natively and hand Mary Banks ID to the system sheet.
  if (ua.includes("MaryBanksApp/")) return false;

  // Already signed in here (the ChurchApps session, or its display cookie).
  if (request.cookies.get("jwt")?.value || request.cookies.get("bt_member")?.value) return false;
  // A check is already under way (or just broke): never loop.
  if (request.cookies.get(SSO_GUARD_COOKIE)) return false;

  if (request.cookies.get(SIGNED_IN_HINT_COOKIE)?.value) return true;
  return !request.cookies.get(SSO_CHECKED_COOKIE);
};
