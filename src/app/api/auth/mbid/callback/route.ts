// Finish a Mary Banks ID sign-in: check the state, exchange the code (server side,
// with the client secret and the PKCE verifier), ask the church API to verify the
// ID token and return a short-lived ChurchApps login token, then let the existing
// ChurchApps login page complete the session (/login?jwt=...). Admin sign-ins go
// on to B1Admin's login page with the same token.

import { NextResponse } from "next/server";
import { ADMIN_URL, FLOW_COOKIE, MBID_CLIENT_ID, MBID_CLIENT_SECRET, MBID_ISSUER, apiBase, publicOrigin, type MbidFlow } from "@/lib/mbid";

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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = publicOrigin(req);
  const flow = readFlow(req);

  if (url.searchParams.get("error")) return fail(origin, url.searchParams.get("error") === "access_denied" ? "cancelled" : "provider");
  if (!flow || !url.searchParams.get("code") || url.searchParams.get("state") !== flow.state) return fail(origin, "session_lost");
  if (!MBID_CLIENT_SECRET) return fail(origin, "not_configured");

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
    if (!tokenRes.ok) return fail(origin, "exchange");
    idToken = ((await tokenRes.json()) as { id_token?: string }).id_token || "";
  } catch {
    return fail(origin, "exchange");
  }
  const claims = decodePayload(idToken);
  if (!claims || claims.nonce !== flow.nonce) return fail(origin, "session_lost");

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
    if (!r.ok) return fail(origin, r.status === 403 ? "email_unverified" : "church_api");
    const data = (await r.json()) as { jwt?: string; firstName?: string };
    loginJwt = data.jwt || "";
    firstName = data.firstName || firstName;
  } catch {
    return fail(origin, "church_api");
  }
  if (!loginJwt) return fail(origin, "church_api");

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
    if (flow.target !== "admin") res.cookies.set("bt_signed_in", "1", { path: "/", sameSite: "lax", secure: origin.startsWith("https://"), maxAge: 60 * 10 });
  }
  // Kept for sign-out, so Mary Banks ID can end its own session too.
  res.cookies.set("mbid_hint", idToken, { path: "/api/auth/mbid", httpOnly: true, sameSite: "lax", secure: origin.startsWith("https://"), maxAge: 60 * 60 * 24 * 30 });
  return res;
}
