import { memberSignInEnabled } from "@/lib/memberSignIn";
// Finish a Mary Banks ID sign-in: check the state, exchange the code (server side,
// with the client secret and the PKCE verifier), ask the church API to verify the
// ID token and return a short-lived ChurchApps login token, then let the existing
// ChurchApps login page complete the session (/login?jwt=...). Admin sign-ins go
// on to B1Admin's login page with the same token.

import { NextResponse } from "next/server";
import { ADMIN_URL, FLOW_COOKIE, MBID_CLIENT_ID, MBID_CLIENT_SECRET, MBID_ISSUER, apiBase, publicOrigin, type MbidFlow } from "@/lib/mbid";
import { GUARD_AFTER_FAILURE_MAX_AGE, MEMBER_PICTURE_COOKIE, NOT_SIGNED_IN_ERRORS, SSO_CHECKED_COOKIE, clearSignedInHint, setChecked, setGuard, setSignedInHint } from "@/lib/mbidSso";

export const dynamic = "force-dynamic";

const fail = (origin: string, reason: string) => {
  const res = NextResponse.redirect(origin + "/login?mbid_error=" + encodeURIComponent(reason), 302);
  res.cookies.set(FLOW_COOKIE, "", { path: "/api/auth/mbid", maxAge: 0 });
  return res;
};

const readFlow = (req: Request): MbidFlow | null => {
  const raw = (req.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(FLOW_COOKIE + "="));
  if (!raw) return null;
  try { return JSON.parse(Buffer.from(raw.slice(FLOW_COOKIE.length + 1), "base64url").toString("utf8")) as MbidFlow; } catch { return null; }
};

const decodePayload = (jwt: string): Record<string, any> | null => {
  try { return JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8")); } catch { return null; }
};

/**
 * A quiet check (prompt=none) that did not sign anyone in: straight back to the page as
 * a guest, never an error page. "Nobody is signed in" also forgets the shared hint; any
 * other failure holds the next check off for a while so it can never loop. keepFlow
 * leaves a flow another tab still has in flight alone.
 */
const guest = (origin: string, returnUrl: string, notSignedIn: boolean, keepFlow = false) => {
  const host = new URL(origin).host;
  const res = NextResponse.redirect(origin + returnUrl, 302);
  res.headers.set("Cache-Control", "no-store");
  if (!keepFlow) res.cookies.set(FLOW_COOKIE, "", { path: "/api/auth/mbid", maxAge: 0 });
  setChecked(res, host);
  if (notSignedIn) clearSignedInHint(res, host);
  else setGuard(res, host, GUARD_AFTER_FAILURE_MAX_AGE);
  return res;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = publicOrigin(req);
  const flow = readFlow(req);
  const error = url.searchParams.get("error");
  const stateMatches = !!flow && url.searchParams.get("state") === flow.state;
  const silent = stateMatches && flow?.silent === true;

  if (!flow || !stateMatches) {
    // Only a quiet check gets "login required" back. Its flow is gone, or another tab's
    // quiet check replaced it: home as a guest, never an error page.
    if (error && NOT_SIGNED_IN_ERRORS.has(error)) return guest(origin, "/", true, true);
    if (flow?.silent) return guest(origin, "/", false, true);
    if (error) return fail(origin, error === "access_denied" ? "cancelled" : "provider");
    return fail(origin, "session_lost");
  }
  // From here on a quiet check that breaks goes back to its page as a guest.
  const failOrGuest = (reason: string) => (silent ? guest(origin, flow.returnUrl, false) : fail(origin, reason));
  if (error) {
    if (silent) return guest(origin, flow.returnUrl, NOT_SIGNED_IN_ERRORS.has(error));
    return fail(origin, error === "access_denied" ? "cancelled" : "provider");
  }
  if (!url.searchParams.get("code")) return failOrGuest("session_lost");
  if (!MBID_CLIENT_SECRET) return failOrGuest("not_configured");
  // Member sign-in off: a member flow started before the switch goes home, signed out.
  if (flow.target !== "admin" && !memberSignInEnabled()) {
    return silent ? guest(origin, flow.returnUrl, false) : NextResponse.redirect(origin + "/", 302);
  }

  // 1. Code -> tokens.
  let idToken = "";
  try {
    const tokenRes = await fetch(MBID_ISSUER + "/protocol/openid-connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: url.searchParams.get("code") as string,
        redirect_uri: origin + "/api/auth/mbid/callback",
        client_id: MBID_CLIENT_ID,
        client_secret: MBID_CLIENT_SECRET,
        code_verifier: flow.verifier
      }),
      cache: "no-store"
    });
    if (!tokenRes.ok) return failOrGuest("exchange");
    idToken = ((await tokenRes.json()) as { id_token?: string }).id_token || "";
  } catch {
    return failOrGuest("exchange");
  }
  const claims = decodePayload(idToken);
  if (!claims || claims.nonce !== flow.nonce) return failOrGuest("session_lost");

  // 2. ID token -> ChurchApps login token (the API verifies the signature, issuer,
  //    audience and email_verified, and links or creates the church user).
  let loginJwt = "";
  let firstName = (claims.given_name as string) || "";
  try {
    const r = await fetch(apiBase() + "/membership/users/mbidLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, subDomain: flow.sd }),
      cache: "no-store"
    });
    if (!r.ok) return failOrGuest(r.status === 403 ? "email_unverified" : "church_api");
    const data = (await r.json()) as { jwt?: string; firstName?: string };
    loginJwt = data.jwt || "";
    firstName = data.firstName || firstName;
  } catch {
    return failOrGuest("church_api");
  }
  if (!loginJwt) return failOrGuest("church_api");

  // 3. Hand the short-lived token to the ChurchApps login page to finish the session.
  const next = flow.target === "admin"
    ? ADMIN_URL + "/login?jwt=" + encodeURIComponent(loginJwt)
    : origin + "/login?jwt=" + encodeURIComponent(loginJwt) + "&returnUrl=" + encodeURIComponent(flow.returnUrl);
  const res = NextResponse.redirect(next, 302);
  res.cookies.set(FLOW_COOKIE, "", { path: "/api/auth/mbid", maxAge: 0 });
  // Display-only: lets the header show the member's initial. Not a credential.
  res.cookies.set("bt_member", encodeURIComponent(firstName || "Member"), { path: "/", sameSite: "lax", secure: origin.startsWith("https://"), maxAge: 60 * 60 * 24 * 30 });
  // Analytics only (lib/analytics.ts): the Mary Banks ID subject, the one id a person has on
  // every Mary Banks site, and a one-time flag that a sign-in just finished. Not credentials.
  if (typeof claims.sub === "string" && claims.sub) {
    res.cookies.set("bt_mbid", claims.sub, { path: "/", sameSite: "lax", secure: origin.startsWith("https://"), maxAge: 60 * 60 * 24 * 30 });
    if (flow.target !== "admin") res.cookies.set("bt_signed_in", silent ? "silent" : "1", { path: "/", sameSite: "lax", secure: origin.startsWith("https://"), maxAge: 60 * 10 });
  }
  // Kept for sign-out, so Mary Banks ID can end its own session too.
  res.cookies.set("mbid_hint", idToken, { path: "/api/auth/mbid", httpOnly: true, sameSite: "lax", secure: origin.startsWith("https://"), maxAge: 60 * 60 * 24 * 30 });
  // Display-only: the member's profile picture (Google accounts), shown in place of the
  // initial. Not a credential. (Next encodes cookie values itself; the browser decodes once.)
  const picture = typeof claims.picture === "string" && claims.picture.startsWith("https://") && claims.picture.length < 1000 ? claims.picture : "";
  if (picture) res.cookies.set(MEMBER_PICTURE_COOKIE, picture, { path: "/", sameSite: "lax", secure: origin.startsWith("https://"), maxAge: 60 * 60 * 24 * 30 });
  else res.cookies.set(MEMBER_PICTURE_COOKIE, "", { path: "/", maxAge: 0 });
  // Signed in: tell the other marybanks.net sites, and drop the "nobody here" marker.
  setSignedInHint(res, new URL(origin).host);
  res.cookies.set(SSO_CHECKED_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
